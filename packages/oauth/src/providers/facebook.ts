import {
	createOAuth2AuthorizationUrl,
	providerUserAuth,
	validateOAuth2AuthorizationCode
} from "../core.js";
import { createUrl, handleRequest, authorizationHeader } from "../request.js";

import type { Auth } from "lucia";
import type { OAuthConfig, OAuthProvider } from "../core.js";

type Config = OAuthConfig & {
	redirectUri: string;
};

const PROVIDER_ID = "facebook";

export const facebook = <_Auth extends Auth>(auth: _Auth, config: Config) => {
	const getFacebookTokens = async (code: string) => {
		const tokens = await validateOAuth2AuthorizationCode<{
			access_token: string;
			expires_in: number;
			refresh_token: string;
		}>(code, "https://graph.facebook.com/v16.0/oauth/access_token", {
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

	const getFacebookUser = async (accessToken: string) => {
		const requestUrl = createUrl("https://graph.facebook.com/me", {
			access_token: accessToken,
			fields: ["id", "name", "picture"].join(",")
		});
		const request = new Request(requestUrl, {
			headers: {
				Authorization: authorizationHeader("bearer", accessToken)
			}
		});
		const facebookUser = await handleRequest<FacebookUser>(request);
		return facebookUser;
	};

	return {
		getAuthorizationUrl: async () => {
			return await createOAuth2AuthorizationUrl(
				"https://www.facebook.com/v16.0/dialog/oauth",
				{
					clientId: config.clientId,
					scope: config.scope ?? [],
					redirectUri: config.redirectUri
				}
			);
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
