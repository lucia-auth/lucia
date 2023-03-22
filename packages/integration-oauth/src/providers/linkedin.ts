import { createUrl, handleRequest, authorizationHeaders } from "../request.js";
import { scope, provider } from "../core.js";

import type { Auth } from "lucia-auth";
import type { OAuthConfig } from "../core.js";

const PROVIDER_ID = "linkedin";

type Config = OAuthConfig & {
	redirectUri: string;
};

export const linkedin = (auth: Auth, config: Config) => {
	const getAuthorizationUrl = async (state: string) => {
		const url = createUrl("https://www.linkedin.com/oauth/v2/authorization", {
			client_id: config.clientId,
			response_type: "code",
			redirect_uri: config.redirectUri,
			scope: scope(["r_liteprofile"], config.scope),
			state
		});
		return url;
	};

	const getTokens = async (code: string) => {
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
			expiresIn: tokens.expires_in,
			refreshToken: tokens.refresh_token,
			refreshTokenExpiresIn: tokens.refresh_token_expires_in,
			scope: tokens.scope
		};
	};

	const getProviderUser = async (accessToken: string) => {
		const linkedinProfile = await getProfile(accessToken);

		const displayImageElement = linkedinProfile.profilePicture[
			"displayImage~"
		]?.elements
			?.slice(-1)
			?.pop();

		const linkedinUser: LinkedinUser = {
			id: linkedinProfile.id,
			firstName: linkedinProfile.localizedFirstName,
			lastName: linkedinProfile.localizedLastName,
			profilePicture: displayImageElement?.identifiers?.pop()?.identifier
		};

		const providerUserId = linkedinProfile.id;
		return [providerUserId, linkedinUser] as const;
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

	return provider(auth, {
		providerId: PROVIDER_ID,
		getAuthorizationUrl,
		getTokens,
		getProviderUser
	});
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
