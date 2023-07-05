import { createUrl, handleRequest, authorizationHeaders } from "../request.js";
import { providerUserAuth } from "../core.js";
import { scope, generateState } from "../utils.js";

import type { Auth } from "lucia";
import type { OAuthConfig, OAuthProvider } from "../core.js";

type Config = OAuthConfig & {
	redirectUri: string;
	forceVerify?: boolean;
};

const PROVIDER_ID = "twitch";

export const twitch = <_Auth extends Auth>(auth: _Auth, config: Config) => {
	const getTwitchTokens = async (code: string) => {
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

	const getTwitchUser = async (accessToken: string) => {
		// https://dev.twitch.tv/docs/api/reference/#get-users
		const request = new Request("https://api.twitch.tv/helix/users", {
			headers: {
				"Client-ID": config.clientId,
				...authorizationHeaders("bearer", accessToken)
			}
		});
		const twitchUsersResponse = await handleRequest<{
			data: TwitchUser[];
		}>(request);
		return twitchUsersResponse.data[0];
	};

	return {
		getAuthorizationUrl: async () => {
			const state = generateState();
			const forceVerify = config.forceVerify ?? false;
			const url = createUrl("https://id.twitch.tv/oauth2/authorize", {
				client_id: config.clientId,
				redirect_uri: config.redirectUri,
				scope: scope([], config.scope),
				response_type: "code",
				force_verify: forceVerify.toString(),
				state
			});
			return [url, state] as const;
		},
		validateCallback: async (code: string) => {
			const twitchTokens = await getTwitchTokens(code);
			const twitchUser = await getTwitchUser(twitchTokens.accessToken);
			const providerUserId = twitchUser.id;
			const twitchUserAuth = await providerUserAuth(
				auth,
				PROVIDER_ID,
				providerUserId
			);
			return {
				...twitchUserAuth,
				twitchUser,
				twitchTokens
			};
		}
	} as const satisfies OAuthProvider;
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
