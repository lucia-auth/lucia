import {
	createOAuth2AuthorizationUrl,
	providerUserAuth,
	validateOAuth2AuthorizationCode,
	decodeIdToken
} from "../core.js";
import { getPKCS8Key } from "../utils.js";
import { createES256SignedJWT } from "../jwt.js";

import type { Auth } from "lucia";
import type { OAuthProvider } from "../core.js";

type AppleConfig = {
	teamId: string;
	keyId: string;
	certificate: string;
};

type Config = {
	redirectUri: string;
	clientId: string;
} & AppleConfig;

const PROVIDER_ID = "apple";
const APPLE_AUD = "https://appleid.apple.com";

export const apple = <_Auth extends Auth>(auth: _Auth, config: Config) => {
	const getAppleTokens = async (code: string): Promise<AppleTokens> => {
		const clientSecret = await createSecretId({
			certificate: config.certificate,
			teamId: config.teamId,
			clientId: config.clientId,
			keyId: config.keyId
		});
		const tokens = await validateOAuth2AuthorizationCode<{
			access_token: string;
			refresh_token?: string;
			expires_in: number;
			id_token: string;
		}>(code, "https://appleid.apple.com/auth/token", {
			clientId: config.clientId,
			redirectUri: config.redirectUri,
			clientPassword: {
				clientSecret,
				authenticateWith: "client_secret"
			}
		});

		return {
			accessToken: tokens.access_token,
			refreshToken: tokens.refresh_token ?? null,
			accessTokenExpiresIn: tokens.expires_in,
			idToken: tokens.id_token
		};
	};

	return {
		getAuthorizationUrl: async () => {
			return await createOAuth2AuthorizationUrl(
				"https://appleid.apple.com/auth/authorize",
				{
					clientId: config.clientId,
					redirectUri: config.redirectUri,
					scope: [],
					searchParams: {
						response_mode: "query"
					}
				}
			);
		},
		validateCallback: async (code: string) => {
			const appleTokens = await getAppleTokens(code);
			const appleUser = getAppleUser(appleTokens.idToken);
			const providerUserId = appleUser.sub;
			const appleUserAuth = await providerUserAuth(
				auth,
				PROVIDER_ID,
				providerUserId
			);

			return {
				...appleUserAuth,
				appleUser,
				appleTokens
			};
		}
	} as const satisfies OAuthProvider;
};

const createSecretId = async (
	config: AppleConfig & {
		clientId: string;
	}
): Promise<string> => {
	const now = Math.floor(Date.now() / 1000);
	const payload = {
		iss: config.teamId,
		iat: now,
		exp: now + 60 * 3,
		aud: APPLE_AUD,
		sub: config.clientId
	};
	const privateKey = getPKCS8Key(config.certificate);
	const jwt = await createES256SignedJWT(
		{
			alg: "ES256",
			kid: config.keyId
		},
		payload,
		privateKey
	);
	return jwt;
};

const getAppleUser = (idToken: string): AppleUser => {
	const jwtPayload = decodeIdToken<AppleUser>(idToken);
	return {
		email: jwtPayload.email,
		email_verified: jwtPayload.email_verified,
		sub: jwtPayload.sub
	};
};

type AppleTokens = {
	accessToken: string;
	refreshToken: string | null;
	accessTokenExpiresIn: number;
	idToken: string;
};

export type AppleUser = {
	email: string;
	email_verified: boolean;
	sub: string;
};
