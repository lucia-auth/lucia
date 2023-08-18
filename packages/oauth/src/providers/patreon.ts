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
	allMemberships?: boolean;
};

const PROVIDER_ID = "patreon";

export const patreon = <_Auth extends Auth>(auth: _Auth, config: Config) => {
	const getPatreonTokens = async (code: string): Promise<PatreonTokens> => {
		const tokens = await validateOAuth2AuthorizationCode<{
			access_token: string;
			refresh_token?: string;
			expires_in: number;
		}>(code, "https://www.patreon.com/api/oauth2/token", {
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

	return {
		getAuthorizationUrl: async () => {
			const scopeConfig = config.scope ?? [];
			return await createOAuth2AuthorizationUrl(
				"https://www.patreon.com/oauth2/authorize",
				{
					clientId: config.clientId,
					redirectUri: config.redirectUri,
					scope: ["identity", ...scopeConfig]
				}
			);
		},
		validateCallback: async (code: string) => {
			const patreonTokens = await getPatreonTokens(code);
			const patreonUser = await getPatreonUser(patreonTokens.accessToken);
			const providerUserId = patreonUser.id;
			const patreonUserAuth = await providerUserAuth(
				auth,
				PROVIDER_ID,
				providerUserId
			);
			return {
				...patreonUserAuth,
				patreonUser,
				patreonTokens
			};
		}
	} as const satisfies OAuthProvider;
};

const getPatreonUser = async (accessToken: string): Promise<PatreonUser> => {
	const requestUrl = createUrl(
		"https://www.patreon.com/api/oauth2/v2/identity",
		{
			"fields[user]":
				"about,email,full_name,hide_pledges,image_url,is_email_verified,url"
		}
	);
	const request = new Request(requestUrl, {
		headers: {
			Authorization: authorizationHeader("bearer", accessToken)
		}
	});
	const { data: patreonUser } = await handleRequest<{
		data: PatreonUser;
	}>(request);

	return patreonUser;
};

type PatreonTokens = {
	accessToken: string;
	refreshToken: string | null;
	accessTokenExpiresIn: number;
};

export type PatreonUser = {
	id: string;
	attributes: {
		about: string | null;
		created: string;
		email?: string;
		full_name: string;
		hide_pledges: boolean | null;
		image_url: string;
		is_email_verified: boolean;
		url: string;
	};
};
