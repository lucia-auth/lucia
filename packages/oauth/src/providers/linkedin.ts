import {
	createOAuth2AuthorizationUrl,
	providerUserAuth,
	validateOAuth2AuthorizationCode
} from "../core.js";
import { handleRequest, authorizationHeader } from "../request.js";

import type { Auth } from "lucia";
import type { OAuthConfig, OAuthProvider } from "../core.js";

const PROVIDER_ID = "linkedin";

type Config = OAuthConfig & {
	redirectUri: string;
};

export const linkedin = <_Auth extends Auth>(auth: _Auth, config: Config) => {
	const getLinkedinTokens = async (code: string): Promise<LinkedinTokens> => {
		const tokens = await validateOAuth2AuthorizationCode<{
			access_token: string;
			expires_in: number;
			refresh_token: string;
			refresh_token_expires_in: number;
			scope: string;
		}>(code, "https://www.linkedin.com/oauth/v2/accessToken", {
			clientId: config.clientId,
			redirectUri: config.redirectUri,
			clientPassword: {
				clientSecret: config.clientSecret,
				authenticateWith: "client_secret"
			}
		});

		return {
			accessToken: tokens.access_token,
			accessTokenExpiresIn: tokens.expires_in,
			refreshToken: tokens.refresh_token,
			refreshTokenExpiresIn: tokens.refresh_token_expires_in,
			scope: tokens.scope
		};
	};

	return {
		getAuthorizationUrl: async () => {
			const scopeConfig = config.scope ?? [];
			return await createOAuth2AuthorizationUrl(
				"https://www.linkedin.com/oauth/v2/authorization",
				{
					clientId: config.clientId,
					redirectUri: config.redirectUri,
					scope: ["profile", ...scopeConfig]
				}
			);
		},
		validateCallback: async (code: string) => {
			const linkedinTokens = await getLinkedinTokens(code);
			const linkedinUser = await getLinkedinUser(linkedinTokens.accessToken);
			const providerUserId = linkedinUser.sub;
			const linkedinUserAuth = await providerUserAuth(
				auth,
				PROVIDER_ID,
				providerUserId
			);
			return {
				...linkedinUserAuth,
				linkedinUser,
				linkedinTokens
			};
		}
	} as const satisfies OAuthProvider;
};

const getLinkedinUser = async (accessToken: string): Promise<LinkedinUser> => {
	const request = new Request("https://api.linkedin.com/v2/userinfo", {
		headers: {
			Authorization: authorizationHeader("bearer", accessToken)
		}
	});
	return handleRequest<LinkedinUser>(request);
};

export type LinkedinTokens = {
	accessToken: string;
	accessTokenExpiresIn: number;
	refreshToken: string;
	refreshTokenExpiresIn: number;
	scope: string;
};

type LinkedinUser = {
	sub: string;
	name: string;
	email: string;
	email_verified: boolean;
	given_name: string;
	family_name: string;
	locale: {
		country: string;
		language: string;
	};
	picture: string;
};
