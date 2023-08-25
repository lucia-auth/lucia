import {
	createOAuth2AuthorizationUrl,
	decodeIdToken,
	providerUserAuth,
	validateOAuth2AuthorizationCode
} from "../core.js";

import type { Auth } from "lucia";
import type { OAuthConfig, OAuthProvider } from "../core.js";

type Config = OAuthConfig & {
	hostedUiDomain: string;
	redirectUri: string;
};

const PROVIDER_ID = "cognito";

export const cognito = <_Auth extends Auth>(auth: _Auth, config: Config) => {
	const getCognitoTokens = async (code: string): Promise<CognitoTokens> => {
		const tokens =
			await validateOAuth2AuthorizationCode<AccessTokenResponseBody>(
				code,
				new URL("/oauth2/token", config.hostedUiDomain),
				{
					clientId: config.clientId,
					redirectUri: config.redirectUri,
					clientPassword: {
						clientSecret: config.clientSecret,
						authenticateWith: "client_secret"
					}
				}
			);

		return {
			accessToken: tokens.access_token,
			refreshToken: tokens.refresh_token,
			idToken: tokens.id_token,
			accessTokenExpiresIn: tokens.expires_in,
			tokenType: tokens.token_type
		};
	};

	return {
		getAuthorizationUrl: async (identityProvider?: string) => {
			const scopeConfig = config.scope ?? [];
			return await createOAuth2AuthorizationUrl(
				new URL("/oauth2/authorize", config.hostedUiDomain),
				{
					clientId: config.clientId,
					scope: ["openid", ...scopeConfig],
					redirectUri: config.redirectUri,
					searchParams: {
						identity_provider: identityProvider ?? ""
					}
				}
			);
		},
		validateCallback: async (code: string) => {
			const cognitoTokens = await getCognitoTokens(code);
			const cognitoUser = getCognitoUser(cognitoTokens.idToken);
			const providerUserId = cognitoUser["cognito:username"];
			const cognitoUserAuth = await providerUserAuth(
				auth,
				PROVIDER_ID,
				providerUserId
			);
			return {
				...cognitoUserAuth,
				cognitoUser,
				cognitoTokens
			};
		}
	} as const satisfies OAuthProvider;
};

const getCognitoUser = (idToken: string): CognitoUser => {
	const cognitoUser = decodeIdToken<CognitoUser>(idToken);
	return cognitoUser;
};

type AccessTokenResponseBody = {
	access_token: string;
	refresh_token: string;
	id_token: string;
	expires_in: number;
	token_type: string;
};

export type CognitoTokens = {
	accessToken: string;
	refreshToken: string;
	idToken: string;
	accessTokenExpiresIn: number;
	tokenType: string;
};

export type CognitoUser = {
	sub: string;
	"cognito:username": string;
	"cognito:groups": string[];
	address?: {
		formatted?: string;
	};
	birthdate?: string;
	email?: string;
	email_verified?: boolean;
	family_name?: string;
	gender?: string;
	given_name?: string;
	locale?: string;
	middle_name?: string;
	name?: string;
	nickname?: string;
	phone_number?: string;
	phone_number_verified?: boolean;
	picture?: string;
	preferred_username?: string;
	profile?: string;
	website?: string;
	zoneinfo?: string;
	updated_at?: number;
};
