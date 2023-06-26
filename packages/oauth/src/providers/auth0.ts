import { createUrl, handleRequest, authorizationHeaders } from "../request.js";
import { providerUserAuth } from "../core.js";
import { scope, generateState } from "../utils.js";

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
		const request = new Request(new URL("/oauth/token", config.appDomain), {
			method: "POST",
			headers: {
				"Content-Type": "application/x-www-form-urlencoded"
			},
			body: new URLSearchParams({
				grant_type: "authorization_code",
				client_id: config.clientId,
				client_secret: config.clientSecret,
				redirect_uri: config.redirectUri,
				code
			})
		});
		const tokens = await handleRequest<{
			access_token: string;
			refresh_token: string;
			id_token: string;
			token_type: string;
		}>(request);

		return {
			accessToken: tokens.access_token,
			refreshToken: tokens.refresh_token,
			idToken: tokens.id_token,
			tokenType: tokens.token_type
		};
	};

	const getAuth0User = async (accessToken: string) => {
		const request = new Request(new URL("/userinfo", config.appDomain), {
			headers: authorizationHeaders("bearer", accessToken)
		});

		const auth0Profile = await handleRequest<Auth0Profile>(request);

		const auth0User: Auth0User = {
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
			const state = generateState();
			const url = createUrl(
				new URL("/authorize", config.appDomain).toString(),
				{
					client_id: config.clientId,
					response_type: "code",
					redirect_uri: config.redirectUri,
					scope: scope(["openid", "profile"], config.scope),
					state,
					...(config.connection && { connection: config.connection }),
					...(config.organization && { organization: config.organization }),
					...(config.invitation && { invitation: config.invitation }),
					...(config.loginHint && { login_hint: config.loginHint })
				}
			);
			return [url, state] as const;
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
	id: string;
	nickname: string;
	name: string;
	picture: string;
	updated_at: string;
};
