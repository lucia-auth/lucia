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
};

const PROVIDER_ID = "discord";

export const discord = <_Auth extends Auth>(auth: _Auth, config: Config) => {
	const getDiscordTokens = async (code: string): Promise<DiscordTokens> => {
		const tokens = await validateOAuth2AuthorizationCode<{
			access_token: string;
			expires_in: number;
			refresh_token: string;
		}>(code, "https://discord.com/api/oauth2/token", {
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

	return {
		getAuthorizationUrl: async () => {
			const scopeConfig = config.scope ?? [];
			return await createOAuth2AuthorizationUrl(
				"https://discord.com/oauth2/authorize",
				{
					clientId: config.clientId,
					scope: ["identify", ...scopeConfig],
					redirectUri: config.redirectUri
				}
			);
		},
		validateCallback: async (code: string) => {
			const discordTokens = await getDiscordTokens(code);
			const discordUser = await getDiscordUser(discordTokens.accessToken);
			const providerUserId = discordUser.id;
			const discordUserAuth = await providerUserAuth(
				auth,
				PROVIDER_ID,
				providerUserId
			);
			return {
				...discordUserAuth,
				discordUser,
				discordTokens
			};
		}
	} as const satisfies OAuthProvider;
};

const getDiscordUser = async (accessToken: string): Promise<DiscordUser> => {
	// do not use oauth/users/@me because it ignores intents, use oauth/users/@me instead
	const request = new Request("https://discord.com/api/users/@me", {
		headers: {
			Authorization: authorizationHeader("bearer", accessToken)
		}
	});
	const discordUser = await handleRequest<DiscordUser>(request);
	return discordUser;
};

type DiscordTokens = {
	accessToken: string;
	refreshToken: string;
	accessTokenExpiresIn: number;
};

export type DiscordUser = {
	id: string;
	username: string;
	discriminator: string;
	avatar: string;
	bot?: boolean;
	system?: boolean;
	mfa_enabled?: boolean;
	verified?: boolean;
	email?: string;
	flags?: number;
	banner?: string;
	accent_color?: number;
	premium_type?: number;
	public_flags?: number;
	locale?: string;
};
