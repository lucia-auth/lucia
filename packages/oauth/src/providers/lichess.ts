import {
	createOAuth2AuthorizationUrlWithPKCE,
	providerUserAuth,
	validateOAuth2AuthorizationCode
} from "../core.js";
import { handleRequest, authorizationHeader } from "../request.js";

import type { Auth } from "lucia";
import type { OAuthConfig, OAuthProvider } from "../core.js";

type Config = Omit<OAuthConfig, "clientSecret"> & {
	redirectUri: string;
};

const PROVIDER_ID = "lichess";

export const lichess = <_Auth extends Auth>(auth: _Auth, config: Config) => {
	const getLichessTokens = async (
		code: string,
		codeVerifier: string
	): Promise<LichessTokens> => {
		const tokens = await validateOAuth2AuthorizationCode<{
			access_token: string;
			expires_in: number;
		}>(code, "https://lichess.org/api/token", {
			clientId: config.clientId,
			redirectUri: config.redirectUri,
			codeVerifier
		});

		return {
			accessToken: tokens.access_token,
			accessTokenExpiresIn: tokens.expires_in
		};
	};

	return {
		getAuthorizationUrl: async () => {
			return await createOAuth2AuthorizationUrlWithPKCE(
				"https://lichess.org/oauth",
				{
					clientId: config.clientId,
					codeChallengeMethod: "S256",
					scope: config.scope ?? [],
					redirectUri: config.redirectUri
				}
			);
		},
		validateCallback: async (code: string, code_verifier: string) => {
			const lichessTokens = await getLichessTokens(code, code_verifier);
			const lichessUser = await getLichessUser(lichessTokens.accessToken);
			const providerUserId = lichessUser.id;
			const lichessUserAuth = await providerUserAuth(
				auth,
				PROVIDER_ID,
				providerUserId
			);
			return {
				...lichessUserAuth,
				lichessUser,
				lichessTokens
			};
		}
	} as const satisfies OAuthProvider;
};

const getLichessUser = async (accessToken: string): Promise<LichessUser> => {
	const request = new Request("https://lichess.org/api/account", {
		headers: {
			Authorization: authorizationHeader("bearer", accessToken)
		}
	});
	const lichessUser = await handleRequest<LichessUser>(request);
	return lichessUser;
};

type LichessTokens = {
	accessToken: string;
	accessTokenExpiresIn: number;
};

export type LichessUser = {
	id: string;
	username: string;
};
