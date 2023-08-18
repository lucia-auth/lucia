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
	const getLinkedinTokens = async (code: string): Promise<LinkedInTokens> => {
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
					scope: ["r_liteprofile", ...scopeConfig]
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

const getLinkedinUser = async (accessToken: string): Promise<LinkedinUser> => {
	const linkedinUserProfile = await getProfile(accessToken);
	const displayImageElement = linkedinUserProfile.profilePicture[
		"displayImage~"
	]?.elements
		?.slice(-1)
		?.pop();
	const linkedinUser: LinkedinUser = {
		id: linkedinUserProfile.id,
		firstName: linkedinUserProfile.localizedFirstName,
		lastName: linkedinUserProfile.localizedLastName,
		profilePicture: displayImageElement?.identifiers?.pop()?.identifier
	};

	return linkedinUser;
};

const getProfile = async (
	accessToken: string
): Promise<LinkedinProfileResponse> => {
	const requestUrl = createUrl("https://api.linkedin.com/v2/me", {
		projection:
			"(id,localizedFirstName,localizedLastName,profilePicture(displayImage~:playableStreams))"
	});

	const request = new Request(requestUrl, {
		headers: {
			Authorization: authorizationHeader("bearer", accessToken)
		}
	});

	return handleRequest<LinkedinProfileResponse>(request);
};

type LinkedinProfileResponse = {
	id: string;
	localizedFirstName: string;
	localizedLastName: string;
	profilePicture: {
		"displayImage~"?: {
			elements?: Array<{
				identifiers?: Array<{
					identifier?: string;
				}>;
			}>;
		};
	};
};

type LinkedInTokens = {
	accessToken: string;
	accessTokenExpiresIn: number;
	refreshToken: string;
	refreshTokenExpiresIn: number;
	scope: string;
};

export type LinkedinUser = {
	id: string;
	firstName: string;
	lastName: string;
	profilePicture?: string;
};
