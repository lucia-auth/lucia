import {
	createOAuth2AuthorizationUrl,
	providerUserAuth,
	validateOAuth2AuthorizationCode
} from "../core.js";
import { handleRequest, authorizationHeader } from "../request.js";

import type { Auth } from "lucia";
import type { OAuthConfig, OAuthProvider } from "../core.js";

const PROVIDER_ID = "auth0";

type Config = OAuthConfig & {
	appDomain: string;
	redirectUri: string;
	connection?: string;
	organization?: string;
	invitation?: string;
	loginHint?: string;
};

export const auth0 = <_Auth extends Auth>(auth: _Auth, config: Config) => {
	const getAuth0Tokens = async (code: string) => {
		const tokens = await validateOAuth2AuthorizationCode<{
			access_token: string;
			refresh_token: string;
			id_token: string;
			token_type: string;
		}>(code, new URL("/oauth/token", config.appDomain), {
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

	const getAuth0User = async (accessToken: string) => {
		const request = new Request(new URL("/userinfo", config.appDomain), {
			headers: {
				Authorization: authorizationHeader("bearer", accessToken)
			}
		});

		const auth0Profile = await handleRequest<Auth0Profile>(request);

		const auth0User: Auth0User = {
			sub: auth0Profile.sub,
			id: auth0Profile.sub.split("|")[1],
			nickname: auth0Profile.nickname,
			name: auth0Profile.name,
			picture: auth0Profile.picture,
			updated_at: auth0Profile.updated_at
		};

		return auth0User;
	};

	return {
		getAuthorizationUrl: async () => {
			const scopeConfig = config.scope ?? [];
			return await createOAuth2AuthorizationUrl(
				new URL("/authorize", config.appDomain),
				{
					clientId: config.clientId,
					redirectUri: config.redirectUri,
					scope: ["openid", "profile", ...scopeConfig],
					searchParams: {
						connection: config.connection,
						organization: config.organization,
						invitation: config.invitation,
						login_hint: config.loginHint
					}
				}
			);
		},
		validateCallback: async (code: string) => {
			const auth0Tokens = await getAuth0Tokens(code);
			const auth0User = await getAuth0User(auth0Tokens.accessToken);
			const providerUserId = auth0User.id;
			const auth0UserAuth = await providerUserAuth(
				auth,
				PROVIDER_ID,
				providerUserId
			);
			return {
				...auth0UserAuth,
				auth0User,
				auth0Tokens
			};
		}
	} as const satisfies OAuthProvider;
};

type Auth0Profile = {
	sub: string;
	nickname: string;
	name: string;
	picture: string;
	updated_at: string;
};

export type Auth0User = {
	sub: string;
	id: string;
	nickname: string;
	name: string;
	picture: string;
	updated_at: string;
};
