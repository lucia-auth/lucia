import { createUrl, handleRequest, authorizationHeaders } from "../request.js";
import { connectAuth, generateState, scope } from "../core.js";

import type { Auth } from "lucia-auth";
import type { OAuthConfig, OAuthProvider } from "../core.js";

type Config = OAuthConfig & {
	redirectUri: string;
};

const PROVIDER_ID = "discord";

export const discord = <_Auth extends Auth>(auth: _Auth, config: Config) => {
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
		return discordUser
	};

	return {
		getAuthorizationUrl: async () => {
			const state = generateState();
			const url = createUrl("https://discord.com/oauth2/authorize", {
				response_type: "code",
				client_id: config.clientId,
				scope: scope(["identify"], config.scope),
				redirect_uri: config.redirectUri,
				state
			});
			return [url, state];
		},
		validateCallback: async (code: string) => {
			const tokens = await getTokens(code);
			const providerUser = await getProviderUser(tokens.accessToken);
			const providerUserId = providerUser.id
			const providerAuth = await connectAuth(auth, PROVIDER_ID, providerUserId);
			return {
				...providerAuth,
				providerUser,
				tokens
			};
		}
	} as const satisfies OAuthProvider<_Auth>;
};

export type DiscordUser = {
	id: string;
	username: string;
	avatar: string;
	discriminator: string;
	public_flags: number;
};
