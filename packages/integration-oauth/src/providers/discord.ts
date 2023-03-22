import { createUrl, handleRequest, authorizationHeaders } from "../request.js";
import { scope, provider } from "../core.js";

import type { Auth } from "lucia-auth";
import type { OAuthConfig } from "../core.js";

type Config = OAuthConfig & {
	redirectUri: string;
};

const PROVIDER_ID = "discord";

export const discord = (auth: Auth, config: Config) => {
	const getAuthorizationUrl = async (state: string) => {
		const url = createUrl("https://discord.com/oauth2/authorize", {
			response_type: "code",
			client_id: config.clientId,
			scope: scope(["identify"], config.scope),
			redirect_uri: config.redirectUri,
			state
		});
		return url;
	};

	const getTokens = async (code: string) => {
		const request = new Request("https://discord.com/api/oauth2/token", {
			method: "POST",
			headers: {
				"Content-Type": "application/x-www-form-urlencoded"
			},
			body: new URLSearchParams({
				client_id: config.clientId,
				client_secret: config.clientSecret,
				grant_type: "authorization_code",
				redirect_uri: config.redirectUri,
				code
			}).toString()
		});
		const tokens = await handleRequest<{
			access_token: string;
			expires_in: number;
			refresh_token: string;
		}>(request);

		return {
			accessToken: tokens.access_token,
			refreshToken: tokens.refresh_token,
			accessTokenExpiresIn: tokens.expires_in
		};
	};

	const getProviderUser = async (accessToken: string) => {
		const request = new Request("https://discord.com/api/oauth2/@me", {
			headers: authorizationHeaders("bearer", accessToken)
		});
		const { user: discordUser } = await handleRequest<{
			user: DiscordUser;
		}>(request);
		const providerUserId = discordUser.id;
		return [providerUserId, discordUser] as const;
	};

	return provider(auth, {
		providerId: PROVIDER_ID,
		getAuthorizationUrl,
		getTokens,
		getProviderUser
	});
};

export type DiscordUser = {
	id: string;
	username: string;
	avatar: string;
	discriminator: string;
	public_flags: number;
};
