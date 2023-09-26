import {
	OAuth2ProviderAuthWithPKCE,
	createOAuth2AuthorizationUrlWithPKCE,
	validateOAuth2AuthorizationCode
} from "../core/oauth2.js";
import { ProviderUserAuth } from "../core/provider.js";
import { handleRequest, authorizationHeader } from "../utils/request.js";

import type { Auth } from "lucia";

type Config = {
  clientId: string;
  clientSecret: string;
  scope?: string[];
  redirectUri?: string;
  authEndpoint: string;
  tokenEndpoint: string;
  userinfoEndpoint: string;
};

const PROVIDER_ID = "keycloak";

export const keycloak = <_Auth extends Auth = Auth>(
	auth: _Auth,
	config: Config
): KeycloakAuth<_Auth> => {
	return new KeycloakAuth(auth, config);
};

export class KeycloakAuth<_Auth extends Auth = Auth> extends OAuth2ProviderAuthWithPKCE<
	KeycloakUserAuth<_Auth>
> {
	private config: Config;

	constructor(auth: _Auth, config: Config) {
		super(auth);

		this.config = config;
	}

	public getAuthorizationUrl = async (): Promise<
		readonly [url: URL, codeVerifier: string, state: string]
	> => {
    const scopeConfig = this.config.scope ?? [];
		return await createOAuth2AuthorizationUrlWithPKCE(
			this.config.authEndpoint,
			{
        clientId: this.config.clientId,
        scope: ["profile", "openid", ...scopeConfig],
        redirectUri: this.config.redirectUri,
        codeChallengeMethod: "S256"
			}
		);
	};

	public validateCallback = async (
		code: string,
    code_verifier: string
	): Promise<KeycloakUserAuth<_Auth>> => {
		const keycloakTokens = await this.validateAuthorizationCode(code, code_verifier);
		const keycloakUser = await getKeycloakUser(this.config.userinfoEndpoint, keycloakTokens.accessToken);
		const keycloakRoles = getKeycloakRoles(keycloakTokens.accessToken)
		return new KeycloakUserAuth(this.auth, keycloakUser, keycloakTokens, keycloakRoles);
	};

	private validateAuthorizationCode = async (
		code: string,
    codeVerifier: string
	): Promise<KeycloakTokens> => {
		const tokens = await validateOAuth2AuthorizationCode<AccessTokenResponseBody>(
			code,
			this.config.tokenEndpoint,
			{
				clientId: this.config.clientId,
				redirectUri: this.config.redirectUri,
				codeVerifier,
				clientPassword: {
					authenticateWith: "http_basic_auth",
					clientSecret: this.config.clientSecret
				}
			}
		);
		const tokenDecoded =  decodeIdToken<Claims>(tokens.access_token)

		if ("refresh_token" in tokens) {
			return {
				accessToken: tokens.access_token,
				accessTokenExpiresIn: tokens.expires_in,
				authTime: tokenDecoded.auth_time,
				idleAt: tokenDecoded.iat,
				expiresAt: tokenDecoded.exp,
				refreshToken: tokens.refresh_token,
				refreshTokenExpiresIn: tokens.refresh_expires_in,
			};
		}
		return {
			accessToken: tokens.access_token,
			accessTokenExpiresIn: tokens.expires_in,
			authTime: tokenDecoded.auth_time,
			idleAt: tokenDecoded.iat,
			expiresAt: tokenDecoded.exp,
			refreshToken: null,
			refreshTokenExpiresIn: null,
		};
	};
}

const getKeycloakUser = async (userinfoEndpoint: string, accessToken: string): Promise<KeycloakUser> => {
	const keycloakUserRequest = new Request(userinfoEndpoint, {
		headers: {
			Authorization: authorizationHeader("bearer", accessToken)
		}
	});
	return await handleRequest<KeycloakUser>(keycloakUserRequest);
};

const getKeycloakRoles = (accessToken: string): KeycloakRole[] => {
	const tokenDecoded: Claims =  decodeIdToken<Claims>(accessToken)
	const keycloakRoles: KeycloakRole[] = []

	if (tokenDecoded.hasOwnProperty('realm_access')) {
		for (const role of tokenDecoded.realm_access.roles) {
			keycloakRoles.push({
				type: 'realm',
				client: null,
				role: role
			})
		}
	}
	if (tokenDecoded.hasOwnProperty('resource_access')) {
		for (const [key, client] of Object.entries(tokenDecoded.resource_access)) {
			for (const role of client.roles) {
				keycloakRoles.push({
					type: 'resource',
					client: key,
					role: role
				})
			}
		}
	}

	return keycloakRoles
}

export class KeycloakUserAuth<
	_Auth extends Auth
> extends ProviderUserAuth<_Auth> {
	public keycloakTokens: KeycloakTokens;
	public keycloakUser: KeycloakUser;
	public keycloakRoles: KeycloakRole[]

	constructor(auth: _Auth, keycloakUser: KeycloakUser, keycloakTokens: KeycloakTokens, keycloakRoles: KeycloakRole[]) {
		super(auth, PROVIDER_ID, keycloakUser.sub);

		this.keycloakTokens = keycloakTokens;
		this.keycloakUser = keycloakUser;
		this.keycloakRoles = keycloakRoles;
	}
}

type AccessTokenResponseBody =
	| {
			access_token: string;
			expires_in: number;
			auth_time: number;
			idle_at: number;
			expires_at: number;
	  }
	| {
		access_token: string;
		expires_in: number;
		auth_time: number;
		idle_at: number;
		expires_at: number;
		refresh_token: string;
		refresh_expires_in: number;
	  };

export type KeycloakTokens = {
  accessToken: string;
  accessTokenExpiresIn: number;
  authTime: number;
  idleAt: number;
  expiresAt: number;
  refreshToken: string | null;
  refreshTokenExpiresIn: number | null;
};

export type Claims = {
	exp: number,
	iat: number,
	auth_time: number,
	realm_access: { roles: string[] }
	resource_access: { [key: string]: { 'roles': string[] } }
}

export type KeycloakUser = {
  sub: string;  // user_id
  name: string;
  preferred_username: string;
  given_name: string;
  locale: string;
  family_name: string;
  email: string;
  email_verified: boolean;
};

export type KeycloakRole = {
	type: "realm" | "resource",
	client: null | string, // null if realm_access
	role: string
}