import {
	createOAuth2AuthorizationUrl,
	providerUserAuth,
	validateOAuth2AuthorizationCode
} from "../core.js";
import { handleRequest, authorizationHeader } from "../request.js";

import type { Auth } from "lucia";
import type { OAuthConfig, OAuthProvider } from "../core.js";

type Config = OAuthConfig & {
	redirectUri: string;
	forceVerify?: boolean;
};

const PROVIDER_ID = "twitch";

export const twitch = <_Auth extends Auth>(auth: _Auth, config: Config) => {
	const getTwitchTokens = async (code: string) => {
		const tokens = await validateOAuth2AuthorizationCode<{
			access_token: string;
			refresh_token: string;
			expires_in: number;
		}>(code, "https://id.twitch.tv/oauth2/token", {
			clientId: config.clientId,
			redirectUri: config.redirectUri,
			clientPassword: {
				clientSecret: config.clientSecret,
				authenticateWith: "client_secret"
			}
		});

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
				Authorization: authorizationHeader("bearer", accessToken)
			}
		});
		const twitchUsersResponse = await handleRequest<{
			data: TwitchUser[];
		}>(request);
		return twitchUsersResponse.data[0];
	};

	return {
		getAuthorizationUrl: async () => {
			const forceVerify = config.forceVerify ?? false;
			return await createOAuth2AuthorizationUrl(
				"https://id.twitch.tv/oauth2/authorize",
				{
					clientId: config.clientId,
					redirectUri: config.redirectUri,
					scope: config.scope ?? [],
					searchParams: {
						force_verify: forceVerify.toString()
					}
				}
			);
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
