import { createUrl, handleRequest, authorizationHeaders } from "../request.js";
import { providerUserAuth } from "../core.js";
import { scope, generateState } from "../utils.js";

import type { Auth } from "lucia";
import type { OAuthConfig, OAuthProvider } from "../core.js";

const PROVIDER_ID = "linkedin";

type Config = OAuthConfig & {
	redirectUri: string;
};

export const linkedin = <_Auth extends Auth>(auth: _Auth, config: Config) => {
	const getLinkedinTokens = async (code: string) => {
		const requestUrl = createUrl(
			"https://www.linkedin.com/oauth/v2/accessToken",
			{
				grant_type: "authorization_code",
				client_id: config.clientId,
				client_secret: config.clientSecret,
				redirect_uri: config.redirectUri,
				code
			}
		);
		const request = new Request(requestUrl, {
			method: "POST",
			headers: {
				"Content-Type": "application/x-www-form-urlencoded"
			}
		});
		const tokens = await handleRequest<{
			access_token: string;
			expires_in: number;
			refresh_token: string;
			refresh_token_expires_in: number;
			scope: string;
		}>(request);

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
			headers: authorizationHeaders("bearer", accessToken)
		});

		return handleRequest<LinkedinProfileResponse>(request);
	};

	return {
		getAuthorizationUrl: async () => {
			const state = generateState();
			const url = createUrl("https://www.linkedin.com/oauth/v2/authorization", {
				client_id: config.clientId,
				response_type: "code",
				redirect_uri: config.redirectUri,
				scope: scope(["r_liteprofile"], config.scope),
				state
			});
			return [url, state] as const;
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

export type LinkedinUser = {
	id: string;
	firstName: string;
	lastName: string;
	profilePicture?: string;
};
