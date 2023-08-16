import {
	createOAuth2AuthorizationUrl,
	decodeIdToken,
	providerUserAuth,
	validateOAuth2AuthorizationCode
} from "../core.js";

import type { Auth } from "lucia";
import type { OAuthConfig, OAuthProvider } from "../core.js";

const PROVIDER_ID = "cognito";

type Config = OAuthConfig & {
	hostedUiDomain: string;
	redirectUri: string;
};

export const cognito = <_Auth extends Auth>(auth: _Auth, config: Config) => {
	const getCognitoTokens = async (code: string) => {
		const tokens = await validateOAuth2AuthorizationCode<CognitoTokens>(
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

	const getCognitoUser = (idToken: string): CognitoUser => {
		const jwtPayload = decodeIdToken<IdTokenPayload>(idToken);
		return {
			sub: jwtPayload.sub,
			cognitoUsername: jwtPayload["cognito:username"],
			cognitoGroups: jwtPayload["cognito:groups"],
			address: jwtPayload.address?.formatted,
			birthdate: jwtPayload.birthdate,
			email: jwtPayload.email,
			emailVerified: jwtPayload.email_verified,
			familyName: jwtPayload.family_name,
			gender: jwtPayload.gender,
			givenName: jwtPayload.given_name,
			locale: jwtPayload.locale,
			middleName: jwtPayload.middle_name,
			name: jwtPayload.name,
			nickname: jwtPayload.nickname,
			picture: jwtPayload.picture,
			preferredUsername: jwtPayload.preferred_username,
			profile: jwtPayload.profile,
			website: jwtPayload.website,
			zoneInfo: jwtPayload.zoneinfo,
			phoneNumber: jwtPayload.phone_number,
			phoneNumberVerified: jwtPayload.phone_number_verified,
			updatedAt: jwtPayload.updated_at
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
			const providerUserId = cognitoUser.cognitoUsername;
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

type IdTokenPayload = {
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

export type CognitoTokens = {
	access_token: string;
	refresh_token: string;
	id_token: string;
	expires_in: number;
	token_type: string;
};

export type CognitoUser = {
	sub: string;
	cognitoUsername: string;
	cognitoGroups: string[];
	address?: string;
	birthdate?: string;
	email?: string;
	emailVerified?: boolean;
	familyName?: string;
	gender?: string;
	givenName?: string;
	locale?: string;
	middleName?: string;
	name?: string;
	nickname?: string;
	picture?: string;
	preferredUsername?: string;
	profile?: string;
	website?: string;
	zoneInfo?: string;
	phoneNumber?: string;
	phoneNumberVerified?: boolean;
	updatedAt?: number;
};
