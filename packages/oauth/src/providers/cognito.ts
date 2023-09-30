import {
	OAuth2ProviderAuth,
	createOAuth2AuthorizationUrl,
	validateOAuth2AuthorizationCode
} from "../core/oauth2.js";
import { decodeIdToken } from "../core/oidc.js";
import { ProviderUserAuth } from "../core/provider.js";

import type { Auth } from "lucia";

type Config = {
	clientId: string;
	clientSecret: string;
	userPoolDomain: string;
	redirectUri: string;
	scope?: string[];
};

const PROVIDER_ID = "cognito";

export const cognito = <_Auth extends Auth = Auth>(
	auth: _Auth,
	config: Config
): CognitoAuth<_Auth> => {
	return new CognitoAuth(auth, config);
};

export class CognitoAuth<_Auth extends Auth = Auth> extends OAuth2ProviderAuth<
	CognitoUserAuth<_Auth>
> {
	private config: Config;

	constructor(auth: _Auth, config: Config) {
		super(auth);

		this.config = config;
	}

	public getAuthorizationUrl = async (): Promise<
		readonly [url: URL, state: string]
	> => {
		const scopeConfig = this.config.scope ?? [];
		return await createOAuth2AuthorizationUrl(
			new URL("/oauth2/authorize", this.config.userPoolDomain),
			{
				clientId: this.config.clientId,
				scope: ["openid", ...scopeConfig],
				redirectUri: this.config.redirectUri
			}
		);
	};

	public validateCallback = async (
		code: string
	): Promise<CognitoUserAuth<_Auth>> => {
		const cognitoTokens = await this.validateAuthorizationCode(code);
		const cognitoUser = getCognitoUser(cognitoTokens.idToken);
		return new CognitoUserAuth(this.auth, cognitoUser, cognitoTokens);
	};

	private validateAuthorizationCode = async (
		code: string
	): Promise<CognitoTokens> => {
		const tokens = await validateOAuth2AuthorizationCode<{
			access_token: string;
			refresh_token: string;
			id_token: string;
			expires_in: number;
			token_type: string;
		}>(code, new URL("/oauth2/token", this.config.userPoolDomain), {
			clientId: this.config.clientId,
			redirectUri: this.config.redirectUri,
			clientPassword: {
				authenticateWith: "client_secret",
				clientSecret: this.config.clientSecret
			}
		});
		return {
			accessToken: tokens.access_token,
			refreshToken: tokens.refresh_token,
			idToken: tokens.id_token,
			accessTokenExpiresIn: tokens.expires_in,
			tokenType: tokens.token_type
		};
	};
}

export class CognitoUserAuth<
	_Auth extends Auth = Auth
> extends ProviderUserAuth<_Auth> {
	public cognitoTokens: CognitoTokens;
	public cognitoUser: CognitoUser;

	constructor(
		auth: _Auth,
		cognitoUser: CognitoUser,
		cognitoTokens: CognitoTokens
	) {
		super(auth, PROVIDER_ID, cognitoUser["cognito:username"]);
		this.cognitoTokens = cognitoTokens;
		this.cognitoUser = cognitoUser;
	}
}

const getCognitoUser = (idToken: string): CognitoUser => {
	const cognitoUser = decodeIdToken<CognitoUser>(idToken);
	return cognitoUser;
};

export type CognitoTokens = {
	accessToken: string;
	refreshToken: string;
	idToken: string;
	accessTokenExpiresIn: number;
	tokenType: string;
};

export type CognitoUser = {
	sub: string;
	"cognito:username": string;
	"cognito:groups": string[];
	address?: {
		formatted?: string;
	};
	birthdate?: string;
	email?: string;
	email_verified?: boolean;
	family_name?: string;
	gender?: string;
	given_name?: string;
	locale?: string;
	middle_name?: string;
	name?: string;
	nickname?: string;
	phone_number?: string;
	phone_number_verified?: boolean;
	picture?: string;
	preferred_username?: string;
	profile?: string;
	website?: string;
	zoneinfo?: string;
	updated_at?: number;
};
