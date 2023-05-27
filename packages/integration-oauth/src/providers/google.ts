import { connectAuth, generateState, scope } from "../core.js";
import { authorizationHeaders, createUrl, handleRequest } from "../request.js";

import type { Auth } from "lucia-auth";
import type { OAuthConfig, OAuthProvider } from "../core.js";

type Config = OAuthConfig & {
	redirectUri: string;
	accessType?: "online" | "offline";
};

const PROVIDER_ID = "google";

export const google = <_Auth extends Auth>(auth: _Auth, config: Config) => {
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
		return googleUser;
	};

	return {
		getAuthorizationUrl: async (redirectUri?: string) => {
			const state = generateState();
			const url = createUrl("https://accounts.google.com/o/oauth2/v2/auth", {
				client_id: config.clientId,
				redirect_uri: redirectUri ?? config.redirectUri,
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
			const tokens = await getTokens(code);
			const providerUser = await getProviderUser(tokens.accessToken);
			const providerUserId = providerUser.sub;
			const providerAuth = await connectAuth(auth, PROVIDER_ID, providerUserId);
			return {
				...providerAuth,
				providerUser,
				tokens
			};
		}
	} as const satisfies OAuthProvider<_Auth>;
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
