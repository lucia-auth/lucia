import {
	createOAuth2AuthorizationUrlWithPKCE,
	providerUserAuth,
	validateOAuth2AuthorizationCode
} from "../core.js";
import { handleRequest, authorizationHeader } from "../request.js";

import type { Auth } from "lucia";
import type { OAuthConfig, OAuthProvider } from "../core.js";

type Config = OAuthConfig & {
	redirectUri: string;
};

const PROVIDER_ID = "twitter";

export const twitter = <_Auth extends Auth>(auth: _Auth, config: Config) => {
	const getTwitterTokens = async (
		code: string,
		codeVerifier: string
	): Promise<TwitterTokens> => {
		const currTimeInSeconds = Math.floor(Date.now() / 1000);
		const tokens = await validateOAuth2AuthorizationCode<{
			access_token: string;
			refresh_token?: string;
		}>(code, "https://api.twitter.com/2/oauth2/token", {
			clientId: config.clientId,
			redirectUri: config.redirectUri,
			codeVerifier,
			clientPassword: {
				authenticateWith: "http_basic_auth",
				clientSecret: config.clientSecret
			}
		});

		return {
			accessToken: tokens.access_token,
			accessTokenExpiresIn: currTimeInSeconds + 60 * 60 * 2 - 60, // 119 minutes
			refreshToken: tokens.refresh_token ?? null
		};
	};

	return {
		getAuthorizationUrl: async () => {
			const scopeConfig = config.scope ?? [];
			const [url, state, codeVerifier] =
				await createOAuth2AuthorizationUrlWithPKCE(
					"https://twitter.com/i/oauth2/authorize",
					{
						clientId: config.clientId,
						codeChallengeMethod: "S256",
						scope: ["tweet.read", "users.read", ...scopeConfig],
						redirectUri: config.redirectUri
					}
				);
			return [url, codeVerifier, state] as const;
		},
		validateCallback: async (code: string, code_verifier: string) => {
			const twitterTokens = await getTwitterTokens(code, code_verifier);
			const twitterUser = await getTwitterUser(twitterTokens.accessToken);
			const providerUserId = twitterUser.id;
			const twitterUserAuth = await providerUserAuth(
				auth,
				PROVIDER_ID,
				providerUserId
			);
			return {
				...twitterUserAuth,
				twitterUser,
				twitterTokens
			};
		}
	} as const satisfies OAuthProvider;
};

const getTwitterUser = async (accessToken: string): Promise<TwitterUser> => {
	const request = new Request("https://api.twitter.com/2/users/me", {
		headers: {
			Authorization: authorizationHeader("bearer", accessToken)
		}
	});
	const twitterUserResult = await handleRequest<{
		data: TwitterUser;
	}>(request);
	return twitterUserResult.data;
};

type TwitterTokens = {
	accessToken: string;
	accessTokenExpiresIn: number;
	refreshToken: string | null;
};

export type TwitterUser = {
	id: string;
	name: string;
	username: string;
};
