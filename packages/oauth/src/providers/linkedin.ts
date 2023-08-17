import {
	createOAuth2AuthorizationUrl,
	providerUserAuth,
	validateOAuth2AuthorizationCode
} from "../core.js";
import { createUrl, handleRequest, authorizationHeader } from "../request.js";

import type { Auth } from "lucia";
import type { OAuthConfig, OAuthProvider } from "../core.js";

const PROVIDER_ID = "linkedin";

type Config = OAuthConfig & {
	redirectUri: string;
};

export const linkedin = <_Auth extends Auth>(auth: _Auth, config: Config) => {
	const getLinkedinTokens = async (code: string) => {
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

	const getLinkedinUser = async (accessToken: string) => {
		const linkedinUserProfile = await getProfile(accessToken);
		const linkedinUser: LinkedinUser = {
			id: linkedinUserProfile.sub,
			firstName: linkedinUserProfile.given_name,
			lastName: linkedinUserProfile.family_name,
			email: linkedinUserProfile.email,
			emailVerified: linkedinUserProfile.email_verified,
			profilePicture: linkedinUserProfile.picture
		};

		return linkedinUser;
	};

	const getProfile = async (
		accessToken: string
	): Promise<LinkedinProfileResponse> => {
		const request = new Request("https://api.linkedin.com/v2/userinfo", {
			headers: {
				Authorization: authorizationHeader("bearer", accessToken)
			}
		});

		return handleRequest<LinkedinProfileResponse>(request);
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
			const providerUserId = linkedinUser.id;
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

type Locale = {
	country: string;
	language: string;
}
type LinkedinProfileResponse = {
	sub: string;
	name: string;
	email: string;
	email_verified: boolean;
	family_name: string;
	family_name: string;
	locale: Locale,
	picture: string | null;
};

export type LinkedinUser = {
	id: string;
	firstName: string;
	lastName: string;
	email: string;
	emailVerified: boolean;
	profilePicture: string;
};
