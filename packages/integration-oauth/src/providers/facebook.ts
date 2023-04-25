import { createUrl, handleRequest, authorizationHeaders } from "../request.js";
import { scope, provider } from "../core.js";

import type { Auth } from "lucia-auth";
import type { OAuthConfig } from "../core.js";

type Config = OAuthConfig & {
	redirectUri: string;
};

const PROVIDER_ID = "facebook";

export const facebook = <A extends Auth>(auth: A, config: Config) => {
	const getAuthorizationUrl = async (state: string) => {
		const url = createUrl("https://www.facebook.com/v16.0/dialog/oauth", {
			client_id: config.clientId,
			scope: scope([], config.scope),
			redirect_uri: config.redirectUri,
			state
		});
		return url;
	};

	const getTokens = async (code: string) => {
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

	const getProviderUser = async (accessToken: string) => {
		const requestUrl = createUrl("https://graph.facebook.com/me", {
			access_token: accessToken,
			fields: ["id", "name", "picture"].join(",")
		});
		const request = new Request(requestUrl, {
			headers: authorizationHeaders("bearer", accessToken)
		});
		const facebookUser = await handleRequest<FacebookUser>(request);
		const providerUserId = facebookUser.id;
		return [providerUserId, facebookUser] as const;
	};

	return provider(auth, {
		providerId: PROVIDER_ID,
		getAuthorizationUrl,
		getTokens,
		getProviderUser
	});
};

export type FacebookUser = {
	id: string;
	name: string;
	picture: string;
};
