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
	redirectUri: string;
	scope?: string[];
	subdomain: string;
};

const PROVIDER_ID = "onelogin";

export const onelogin = <_Auth extends Auth = Auth>(
	auth: _Auth,
	config: Config
): OneloginAuth<_Auth> => {
	return new OneloginAuth(auth, config);
};

export class OneloginAuth<
	_Auth extends Auth = Auth
> extends OAuth2ProviderAuthWithPKCE<OneloginUserAuth<_Auth>> {
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
			`https://${this.config.subdomain}.onelogin.com/oidc/2/auth`,
			{
				clientId: this.config.clientId,
				codeChallengeMethod: "S256",
				scope: ["openid", "profile", ...scopeConfig],
				redirectUri: this.config.redirectUri
			}
		);
	};

	public validateCallback = async (
		code: string,
		code_verifier: string
	): Promise<OneloginUserAuth<_Auth>> => {
		const oneloginTokens = await this.validateAuthorizationCode(
			code,
			code_verifier
		);
		const oneloginUser = await getOneloginUser(
			oneloginTokens.accessToken,
			this.config.subdomain
		);
		return new OneloginUserAuth(this.auth, oneloginUser, oneloginTokens);
	};

	private validateAuthorizationCode = async (
		code: string,
		codeVerifier: string
	): Promise<OneloginTokens> => {
		const tokens = await validateOAuth2AuthorizationCode<{
			access_token: string;
			refresh_token?: string;
		}>(code, `https://${this.config.subdomain}.onelogin.com/oidc/2/token`, {
			clientId: this.config.clientId,
			redirectUri: this.config.redirectUri,
			codeVerifier,
			clientPassword: {
				authenticateWith: "http_basic_auth",
				clientSecret: this.config.clientSecret
			}
		});

		return {
			accessToken: tokens.access_token,
			refreshToken: tokens.refresh_token ?? null
		};
	};
}

export class OneloginUserAuth<
	_Auth extends Auth = Auth
> extends ProviderUserAuth<_Auth> {
	public oneloginTokens: OneloginTokens;
	public oneloginUser: OneloginUser;

	constructor(
		auth: _Auth,
		oneloginUser: OneloginUser,
		oneloginTokens: OneloginTokens
	) {
		super(auth, PROVIDER_ID, oneloginUser.sub);
		this.oneloginTokens = oneloginTokens;
		this.oneloginUser = oneloginUser;
	}
}

const getOneloginUser = async (
	accessToken: string,
	subdomain: string
): Promise<OneloginUser> => {
	const request = new Request(
		`https://${subdomain}.onelogin.com/oidc/2/me`,
		{
			headers: {
				Authorization: authorizationHeader("bearer", accessToken)
			}
		}
	);
	return await handleRequest(request);
};

export type OneloginTokens = {
	accessToken: string;
	refreshToken: string | null;
};

export type OneloginUser = {
	sub: string;
	email: string;
	preferred_username: string;
	name: string;
	updated_at: number;
	given_name: string;
	family_name: string;
	groups?: string[];
};
