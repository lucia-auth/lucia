import { createUrl, handleRequest, authorizationHeaders } from "../request.js";
import { providerUserAuth } from "../core.js";
import { scope, generateState } from "../utils.js";

import type { Auth } from "lucia";
import type { OAuthConfig, OAuthProvider } from "../core.js";

type Config = OAuthConfig & {
	redirectUri: string;
};

const PROVIDER_ID = "facebook";

export const facebook = <_Auth extends Auth>(auth: _Auth, config: Config) => {
	const getFacebookTokens = async (code: string) => {
		const requestUrl = createUrl(
			"https://graph.facebook.com/v16.0/oauth/access_token",
			{
				client_id: config.clientId,
				client_secret: config.clientSecret,
				redirect_uri: config.redirectUri,
				code
			}
		);
		const request = new Request(requestUrl);
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

	const getFacebookUser = async (accessToken: string) => {
		const requestUrl = createUrl("https://graph.facebook.com/me", {
			access_token: accessToken,
			fields: ["id", "name", "picture"].join(",")
		});
		const request = new Request(requestUrl, {
			headers: authorizationHeaders("bearer", accessToken)
		});
		const facebookUser = await handleRequest<FacebookUser>(request);
		return facebookUser;
	};

	return {
		getAuthorizationUrl: async () => {
			const state = generateState();
			const url = createUrl("https://www.facebook.com/v16.0/dialog/oauth", {
				client_id: config.clientId,
				scope: scope([], config.scope),
				redirect_uri: config.redirectUri,
				state
			});
			return [url, state] as const;
		},
		validateCallback: async (code: string) => {
			const tokens = await getFacebookTokens(code);
			const facebookUser = await getFacebookUser(tokens.accessToken);
			const providerUserId = facebookUser.id;
			const facebookUserAuth = await providerUserAuth(
				auth,
				PROVIDER_ID,
				providerUserId
			);
			return {
				...facebookUserAuth,
				facebookUser,
				tokens
			};
		}
	} as const satisfies OAuthProvider;
};

export type FacebookUser = {
	id: string;
	name: string;
	picture: {
		data: {
			height: number;
			is_silhouette: boolean;
			url: string;
			width: number;
		};
	};
};
