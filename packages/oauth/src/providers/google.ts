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
	accessType?: "online" | "offline";
};

const PROVIDER_ID = "google";

export const google = <_Auth extends Auth>(auth: _Auth, config: Config) => {
	const getGoogleTokens = async (code: string) => {
		const tokens = await validateOAuth2AuthorizationCode<{
			access_token: string;
			refresh_token?: string;
			expires_in: number;
		}>(code, "https://oauth2.googleapis.com/token", {
			clientId: config.clientId,
			redirectUri: config.redirectUri,
			clientPassword: {
				clientSecret: config.clientSecret,
				authenticateWith: "client_secret"
			}
		});

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
				headers: {
					Authorization: authorizationHeader("bearer", accessToken)
				}
			}
		);
		const googleUser = await handleRequest<GoogleUser>(request);
		return googleUser;
	};

	return {
		getAuthorizationUrl: async () => {
			const scopeConfig = config.scope ?? [];
			return await createOAuth2AuthorizationUrl(
				"https://accounts.google.com/o/oauth2/v2/auth",
				{
					clientId: config.clientId,
					redirectUri: config.redirectUri,
					scope: [
						"https://www.googleapis.com/auth/userinfo.profile",
						...scopeConfig
					],
					searchParams: {
						access_type: config.accessType ?? "online"
					}
				}
			);
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
