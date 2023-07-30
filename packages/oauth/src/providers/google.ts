import { createUrl, handleRequest, authorizationHeaders } from "../request.js";
import { providerUserAuth } from "../core.js";
import { scope, generateState } from "../utils.js";

import type { Auth } from "lucia";
import type { OAuthConfig, OAuthProvider } from "../core.js";

type Config = OAuthConfig & {
	redirectUri: string;
	accessType?: "online" | "offline";
};

const PROVIDER_ID = "google";

export const google = <_Auth extends Auth>(auth: _Auth, config: Config) => {
	const getGoogleTokens = async (code: string) => {
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

	const getGoogleUser = async (accessToken: string) => {
		const request = new Request(
			"https://www.googleapis.com/oauth2/v3/userinfo",
			{
				headers: authorizationHeaders("bearer", accessToken)
			}
		);
		const googleUser = await handleRequest<GoogleUser>(request);
		return googleUser;
	};

	return {
		getAuthorizationUrl: async () => {
			const state = generateState();
			const url = createUrl("https://accounts.google.com/o/oauth2/v2/auth", {
				client_id: config.clientId,
				redirect_uri: config.redirectUri,
				scope: scope(
					["https://www.googleapis.com/auth/userinfo.profile"],
					config.scope
				),
				response_type: "code",
				access_type: config.accessType ?? "online",
				state
			});
			return [url, state] as const;
		},
		validateCallback: async (code: string) => {
			const googleTokens = await getGoogleTokens(code);
			const googleUser = await getGoogleUser(googleTokens.accessToken);
			const providerUserId = googleUser.sub;
			const googleUserAuth = await providerUserAuth(
				auth,
				PROVIDER_ID,
				providerUserId
			);
			return {
				...googleUserAuth,
				googleUser,
				googleTokens
			};
		}
	} as const satisfies OAuthProvider;
};

export type GoogleUser = {
	sub: string;
	name: string;
	given_name: string;
	family_name: string;
	picture: string;
	locale: string;
	email?: string;
	email_verified?: boolean;
	hd?: string;
};
