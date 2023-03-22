import { createUrl, handleRequest, authorizationHeaders } from "../request.js";
import { scope, provider } from "../core.js";

import type { Auth } from "lucia-auth";
import type { OAuthConfig } from "../core.js";

type Config = OAuthConfig & {
	redirectUri: string;
	forceVerify?: boolean;
};

const PROVIDER_ID = "twitch";

export const twitch = <A extends Auth>(auth: A, config: Config) => {
	const getAuthorizationUrl = async (state: string) => {
		const forceVerify = config.forceVerify ?? false;
		const url = createUrl("https://id.twitch.tv/oauth2/authorize", {
			client_id: config.clientId,
			redirect_uri: config.redirectUri,
			scope: scope([], config.scope),
			response_type: "code",
			force_verify: forceVerify.toString(),
			state
		});

		return url;
	};

	const getTokens = async (code: string) => {
		const requestUrl = createUrl("https://id.twitch.tv/oauth2/token", {
			client_id: config.clientId,
			client_secret: config.clientSecret,
			code,
			grant_type: "authorization_code",
			redirect_uri: config.redirectUri
		});
		const request = new Request(requestUrl, {
			method: "POST"
		});
		const tokens = await handleRequest<{
			access_token: string;
			refresh_token: string;
			expires_in: number;
		}>(request);

		return {
			accessToken: tokens.access_token,
			refreshToken: tokens.refresh_token,
			accessTokenExpiresIn: tokens.expires_in
		};
	};

	const getProviderUser = async (accessToken: string) => {
		const request = new Request("https://api.twitch.tv/helix/users", {
			headers: {
				"Client-ID": config.clientId,
				...authorizationHeaders("bearer", accessToken)
			}
		});
		const twitchUser = await handleRequest<TwitchUser>(request);
		const providerUserId = twitchUser.id;

		return [providerUserId, twitchUser] as const;
	};

	return provider(auth, {
		providerId: PROVIDER_ID,
		getAuthorizationUrl,
		getTokens,
		getProviderUser
	});
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
