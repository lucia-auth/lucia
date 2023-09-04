import {
	OAuth2ProviderAuth,
	createOAuth2AuthorizationUrl,
	validateOAuth2AuthorizationCode
} from "../core/oauth2.js";
import { ProviderUserAuth } from "../core/provider.js";
import { handleRequest, authorizationHeader } from "../utils/request.js";

import type { Auth } from "lucia";

type Config = {
	clientId: string;
	clientSecret: string;
	scope?: string[];
	redirectUri: string;
};

const PROVIDER_ID = "twitch";

export const twitch = <_Auth extends Auth = Auth>(
	auth: _Auth,
	config: Config
): TwitchAuth<_Auth> => {
	return new TwitchAuth(auth, config);
};

export class TwitchAuth<_Auth extends Auth = Auth> extends OAuth2ProviderAuth<
	TwitchUserAuth<_Auth>
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
			"https://id.twitch.tv/oauth2/authorize",
			{
				clientId: this.config.clientId,
				redirectUri: this.config.redirectUri,
				scope: this.config.scope ?? []
			}
		);
	};

	public validateCallback = async (
		code: string
	): Promise<TwitchUserAuth<_Auth>> => {
		const twitchTokens = await this.validateAuthorizationCode(code);
		const twitchUser = await getTwitchUser(
			this.config.clientId,
			twitchTokens.accessToken
		);
		return new TwitchUserAuth(this.auth, twitchUser, twitchTokens);
	};

	private validateAuthorizationCode = async (
		code: string
	): Promise<TwitchTokens> => {
		const tokens = await validateOAuth2AuthorizationCode<{
			access_token: string;
			refresh_token: string;
			expires_in: number;
		}>(code, "https://id.twitch.tv/oauth2/token", {
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

export class TwitchUserAuth<
	_Auth extends Auth = Auth
> extends ProviderUserAuth<_Auth> {
	public twitchTokens: TwitchTokens;
	public twitchUser: TwitchUser;

	constructor(auth: _Auth, twitchUser: TwitchUser, twitchTokens: TwitchTokens) {
		super(auth, PROVIDER_ID, twitchUser.id);

		this.twitchTokens = twitchTokens;
		this.twitchUser = twitchUser;
	}
}

const getTwitchUser = async (
	clientId: string,
	accessToken: string
): Promise<TwitchUser> => {
	// https://dev.twitch.tv/docs/api/reference/#get-users
	const request = new Request("https://api.twitch.tv/helix/users", {
		headers: {
			"Client-ID": clientId,
			Authorization: authorizationHeader("bearer", accessToken)
		}
	});
	const twitchUsersResponse = await handleRequest<{
		data: TwitchUser[];
	}>(request);
	return twitchUsersResponse.data[0];
};

export type TwitchTokens = {
	accessToken: string;
	refreshToken: string;
	accessTokenExpiresIn: number;
};

export type TwitchUser = {
	id: string;
	login: string;
	display_name: string;
	type: "" | "admin" | "staff" | "global_mod";
	broadcaster_type: "" | "affiliate" | "partner";
	description: string;
	profile_image_url: string;
	offline_image_url: string;
	view_count: number;
	email?: string;
	created_at: string;
};
