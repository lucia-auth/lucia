import {
	OAuth2ProviderAuth,
	createOAuth2AuthorizationUrl,
	validateOAuth2AuthorizationCode
} from "../core/oauth2.js";
import { ProviderUserAuth } from "../core/provider.js";
import { handleRequest, authorizationHeader } from "../utils/request.js";

import type { Auth } from "lucia";

const PROVIDER_ID = "linkedin";

type Config = {
	clientId: string;
	clientSecret: string;
	redirectUri: string;
	scope?: string[];
};

export const linkedIn = <_Auth extends Auth = Auth>(
	auth: _Auth,
	config: Config
): LinkedInAuth<_Auth> => {
	return new LinkedInAuth(auth, config);
};

export class LinkedInAuth<_Auth extends Auth = Auth> extends OAuth2ProviderAuth<
	LinkedInUserAuth<_Auth>
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
			"https://www.linkedin.com/oauth/v2/authorization",
			{
				clientId: this.config.clientId,
				redirectUri: this.config.redirectUri,
				scope: ["profile", ...scopeConfig]
			}
		);
	};

	public validateCallback = async (
		code: string
	): Promise<LinkedInUserAuth<_Auth>> => {
		const linkedInTokens = await this.validateAuthorizationCode(code);
		const linkedInUser = await getLinkedInUser(linkedInTokens.accessToken);
		return new LinkedInUserAuth(this.auth, linkedInUser, linkedInTokens);
	};

	private validateAuthorizationCode = async (
		code: string
	): Promise<LinkedInTokens> => {
		const tokens = await validateOAuth2AuthorizationCode<{
			access_token: string;
			expires_in: number;
			refresh_token: string;
			refresh_token_expires_in: number;
			scope: string;
		}>(code, "https://www.linkedin.com/oauth/v2/accessToken", {
			clientId: this.config.clientId,
			redirectUri: this.config.redirectUri,
			clientPassword: {
				clientSecret: this.config.clientSecret,
				authenticateWith: "client_secret"
			}
		});

		return {
			accessToken: tokens.access_token,
			accessTokenExpiresIn: tokens.expires_in,
			refreshToken: tokens.refresh_token,
			refreshTokenExpiresIn: tokens.refresh_token_expires_in,
			scope: tokens.scope
		};
	};
}

export class LinkedInUserAuth<
	_Auth extends Auth = Auth
> extends ProviderUserAuth<_Auth> {
	public linkedInTokens: LinkedInTokens;
	public linkedInUser: LinkedInUser;

	constructor(
		auth: _Auth,
		linkedInUser: LinkedInUser,
		linkedInTokens: LinkedInTokens
	) {
		super(auth, PROVIDER_ID, linkedInUser.sub);

		this.linkedInTokens = linkedInTokens;
		this.linkedInUser = linkedInUser;
	}
}

const getLinkedInUser = async (accessToken: string): Promise<LinkedInUser> => {
	const request = new Request("https://api.linkedin.com/v2/userinfo", {
		headers: {
			Authorization: authorizationHeader("bearer", accessToken)
		}
	});
	return handleRequest<LinkedInUser>(request);
};

export type LinkedInTokens = {
	accessToken: string;
	accessTokenExpiresIn: number;
	refreshToken: string;
	refreshTokenExpiresIn: number;
	scope: string;
};

export type LinkedInUser = {
	sub: string;
	name: string;
	email: string;
	email_verified: boolean;
	given_name: string;
	family_name: string;
	locale: {
		country: string;
		language: string;
	};
	picture: string;
};
