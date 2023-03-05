import { createUrl, handleRequest, authorizationHeaders } from "../request.js";
import { scope, provider } from "../core.js";

import type { Auth } from "lucia-auth";
import type { OAuthConfig } from "../core.js";

type Config = OAuthConfig & {
	redirectUri: string;
};

const PROVIDER_ID = "google";

export const google = <A extends Auth>(auth: A, config: Config) => {
	const getAuthorizationUrl = async (state: string) => {
		const url = createUrl("https://accounts.google.com/o/oauth2/v2/auth", {
			client_id: config.clientId,
			redirect_uri: config.redirectUri,
			scope: scope([], config.scope),
			response_type: "code",
			state
		});
		return url;
	};

	const getTokens = async (code: string) => {
		const requestUrl = createUrl("https://oauth2.googleapis.com/token", {
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
			refresh_token?: string;
			expires_in: number;
		}>(request);
		return {
			accessToken: tokens.access_token,
			refreshToken: tokens.refresh_token ?? null,
			accessTokenExpiresIn: tokens.expires_in
		};
	};
	const getProviderUser = async (accessToken: string) => {
		const request = new Request(
			"https://www.googleapis.com/oauth2/v3/userinfo",
			{
				headers: authorizationHeaders("bearer", accessToken)
			}
		);
		const googleUser = await handleRequest<GoogleUser>(request);
		const providerUserId = googleUser.sub;
		return [providerUserId, googleUser] as const;
	};
	return provider(auth, {
		providerId: PROVIDER_ID,
		getAuthorizationUrl,
		getTokens,
		getProviderUser
	});
};

export type GoogleUser = {
	sub: string;
	name: string;
	given_name: string;
	family_name: string;
	picture: string;
	email: string;
	email_verified: boolean;
	locale: string;
	hd: string;
};
