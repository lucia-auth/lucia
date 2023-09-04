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
};

const PROVIDER_ID = "twitter";

export const twitter = <_Auth extends Auth = Auth>(
	auth: _Auth,
	config: Config
): TwitterAuth<_Auth> => {
	return new TwitterAuth(auth, config);
};

export class TwitterAuth<
	_Auth extends Auth = Auth
> extends OAuth2ProviderAuthWithPKCE<TwitterUserAuth<_Auth>> {
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
			"https://twitter.com/i/oauth2/authorize",
			{
				clientId: this.config.clientId,
				codeChallengeMethod: "S256",
				scope: ["tweet.read", "users.read", ...scopeConfig],
				redirectUri: this.config.redirectUri
			}
		);
	};

	public validateCallback = async (
		code: string,
		code_verifier: string
	): Promise<TwitterUserAuth<_Auth>> => {
		const twitterTokens = await this.validateAuthorizationCode(
			code,
			code_verifier
		);
		const twitterUser = await getTwitterUser(twitterTokens.accessToken);
		return new TwitterUserAuth(this.auth, twitterUser, twitterTokens);
	};

	private validateAuthorizationCode = async (
		code: string,
		codeVerifier: string
	): Promise<TwitterTokens> => {
		const tokens = await validateOAuth2AuthorizationCode<{
			access_token: string;
			refresh_token?: string;
		}>(code, "https://api.twitter.com/2/oauth2/token", {
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

export class TwitterUserAuth<
	_Auth extends Auth = Auth
> extends ProviderUserAuth<_Auth> {
	public twitterTokens: TwitterTokens;
	public twitterUser: TwitterUser;

	constructor(
		auth: _Auth,
		twitterUser: TwitterUser,
		twitterTokens: TwitterTokens
	) {
		super(auth, PROVIDER_ID, twitterUser.id);
		this.twitterTokens = twitterTokens;
		this.twitterUser = twitterUser;
	}
}

const getTwitterUser = async (accessToken: string): Promise<TwitterUser> => {
	const request = new Request("https://api.twitter.com/2/users/me", {
		headers: {
			Authorization: authorizationHeader("bearer", accessToken)
		}
	});
	const twitterUserResult = await handleRequest<{
		data: TwitterUser;
	}>(request);
	return twitterUserResult.data;
};

export type TwitterTokens = {
	accessToken: string;
	refreshToken: string | null;
};

export type TwitterUser = {
	id: string;
	name: string;
	username: string;
};
