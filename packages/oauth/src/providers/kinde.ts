import {
	createOAuth2AuthorizationUrlWithPKCE,
	providerUserAuth,
	validateOAuth2AuthorizationCode
} from "../core";
import { handleRequest, authorizationHeader } from "../request.js";

import type { Auth } from "lucia";
import type { OAuthConfig, OAuthProvider } from "../core";

const PROVIDER_ID = "kinde";

type Config = OAuthConfig & {
	appDomain: string;
	redirectUri: string;
	logoutRedirectUri: string;
};

export const kinde = <_Auth extends Auth>(auth: _Auth, config: Config) => {
	const getKindeTokens = async (code: string) => {
		const tokens = await validateOAuth2AuthorizationCode<{
			access_token: string;
			refresh_token: string;
			id_token: string;
			token_type: string;
		}>(code, new URL("/oauth2/token", config.appDomain), {
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
			idToken: tokens.id_token,
			tokenType: tokens.token_type
		};
	};

	return {
		getAuthorizationUrl: async () => {
			return await createOAuth2AuthorizationUrlWithPKCE(
				new URL("/oauth2/auth", config.appDomain),
				{
					clientId: config.clientId,
					scope: ["openid", "profile", ...(config.scope ?? [])],
					redirectUri: config.redirectUri,
					codeChallengeMethod: "S256"
				}
			);
		},

		validateCallback: async (code: string) => {
			const kindeTokens = await getKindeTokens(code);
			const kindeUser = await getKindeUser(
				config.appDomain,
				kindeTokens.accessToken
			);
			const providerUserId = kindeUser.id;
			const kindeUserAuth = await providerUserAuth(
				auth,
				PROVIDER_ID,
				providerUserId
			);
			return {
				...kindeUserAuth,
				kindeUser,
				kindeTokens
			};
		}
	} as const satisfies OAuthProvider;
};

const getKindeUser = async (appDomain: string, accessToken: string) => {
	const request = new Request(new URL("/oauth2/user_profile", appDomain), {
		headers: {
			Authorization: authorizationHeader("bearer", accessToken)
		}
	});

	const kindeProfile = await handleRequest<KindeProfile>(request);

	const kindeUser: KindeUser = {
		id: kindeProfile.id,
		given_name: kindeProfile.given_name,
		family_name: kindeProfile.family_name,
		email: kindeProfile.email,
		picture: kindeProfile.picture
	};

	return kindeUser;
};

type KindeProfile = {
	id: string;
	given_name: string;
	family_name: string;
	email: string;
	picture: string;
};

export type KindeUser = {
	id: string;
	given_name: string;
	family_name: string;
	email: string;
	picture: string;
};
