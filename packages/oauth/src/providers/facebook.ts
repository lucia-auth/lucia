import {
	OAuth2ProviderAuth,
	createOAuth2AuthorizationUrl,
	validateOAuth2AuthorizationCode
} from "../core/oauth2.js";
import { ProviderUserAuth } from "../core/provider.js";
import {
	handleRequest,
	authorizationHeader,
	createUrl
} from "../utils/request.js";

import type { Auth } from "lucia";

type Config = {
	clientId: string;
	clientSecret: string;
	redirectUri: string;
	scope?: string[];
};

const PROVIDER_ID = "facebook";

export const facebook = <_Auth extends Auth = Auth>(
	auth: _Auth,
	config: Config
): FacebookAuth<_Auth> => {
	return new FacebookAuth(auth, config);
};

export class FacebookAuth<_Auth extends Auth = Auth> extends OAuth2ProviderAuth<
	FacebookUserAuth<_Auth>
> {
	private config: Config;

	constructor(auth: _Auth, config: Config) {
		super(auth);

		this.config = config;
	}

	public getAuthorizationUrl = async (): Promise<
		readonly [url: URL, state: string]
	> => {
		return await createOAuth2AuthorizationUrl(
			"https://www.facebook.com/v16.0/dialog/oauth",
			{
				clientId: this.config.clientId,
				scope: this.config.scope ?? [],
				redirectUri: this.config.redirectUri
			}
		);
	};

	public validateCallback = async (
		code: string
	): Promise<FacebookUserAuth<_Auth>> => {
		const facebookTokens = await this.validateAuthorizationCode(code);
		const facebookUser = await getFacebookUser(facebookTokens.accessToken);
		return new FacebookUserAuth(this.auth, facebookUser, facebookTokens);
	};

	private validateAuthorizationCode = async (
		code: string
	): Promise<FacebookTokens> => {
		const tokens = await validateOAuth2AuthorizationCode<{
			access_token: string;
			expires_in: number;
			refresh_token: string;
		}>(code, "https://graph.facebook.com/v16.0/oauth/access_token", {
			clientId: this.config.clientId,
			redirectUri: this.config.redirectUri,
			clientPassword: {
				clientSecret: this.config.clientSecret,
				authenticateWith: "client_secret"
			}
		});

		return {
			accessToken: tokens.access_token,
			refreshToken: tokens.refresh_token,
			accessTokenExpiresIn: tokens.expires_in
		};
	};
}

export class FacebookUserAuth<
	_Auth extends Auth = Auth
> extends ProviderUserAuth<_Auth> {
	public facebookTokens: FacebookTokens;
	public facebookUser: FacebookUser;

	constructor(
		auth: _Auth,
		facebookUser: FacebookUser,
		facebookTokens: FacebookTokens
	) {
		super(auth, PROVIDER_ID, facebookUser.id);

		this.facebookTokens = facebookTokens;
		this.facebookUser = facebookUser;
	}
}

const getFacebookUser = async (accessToken: string): Promise<FacebookUser> => {
	const requestUrl = createUrl("https://graph.facebook.com/me", {
		access_token: accessToken,
		fields: ["id", "name", "picture", "email"].join(",")
	});
	const request = new Request(requestUrl, {
		headers: {
			Authorization: authorizationHeader("bearer", accessToken)
		}
	});
	const facebookUser = await handleRequest<FacebookUser>(request);
	return facebookUser;
};

export type FacebookTokens = {
	accessToken: string;
	refreshToken: string;
	accessTokenExpiresIn: number;
};

export type FacebookUser = {
	id: string;
	name: string;
	email?: string;
	picture: {
		data: {
			height: number;
			is_silhouette: boolean;
			url: string;
			width: number;
		};
	};
};
