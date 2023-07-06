import { createUrl, handleRequest } from "../request.js";
import { providerUserAuth } from "../core.js";
import { generateState } from "../utils.js";
import { importPKCS8, SignJWT, decodeJwt } from "jose";

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
	const createSecretId = async ({
		certificate,
		teamId,
		clientId,
		keyId
	}: AppleConfig & {
		clientId: string;
	}) => {
		const ALG = `ES256`;
		const now = Math.floor(Date.now() / 1000);
		const payload = {
			iss: teamId,
			iat: now,
			exp: now + 60 * 3,
			aud: APPLE_AUD,
			sub: clientId
		};

		const cert = await importPKCS8(certificate, ALG);

		const jwt = await new SignJWT(payload)
			.setProtectedHeader({ alg: ALG, kid: keyId })
			.sign(cert);

		return jwt;
	};

	const getAppleTokens = async (code: string) => {
		const requestUrl = createUrl("https://appleid.apple.com/auth/token", {
			client_id: config.clientId,
			client_secret: await createSecretId({
				certificate: config.certificate,
				teamId: config.teamId,
				clientId: config.clientId,
				keyId: config.keyId
			}),
			code,
			grant_type: "authorization_code",
			redirect_uri: config.redirectUri
		});

		const request = new Request(requestUrl, {
			method: "POST"
		});

		const tokens = await handleRequest<{
			access_token: string;
			refresh_token?: string;
			expires_in: number;
			id_token: string;
		}>(request);

		return {
			accessToken: tokens.access_token,
			refreshToken: tokens.refresh_token ?? null,
			accessTokenExpiresIn: tokens.expires_in,
			idToken: tokens.id_token
		};
	};

	const getAppleUser = async (idToken: string) => {
		return decodeJwt(idToken) as AppleUser;
	};

	return {
		getAuthorizationUrl: async (redirectUri?: string) => {
			const state = generateState();
			const url = createUrl("https://appleid.apple.com/auth/authorize", {
				client_id: config.clientId,
				redirect_uri: redirectUri ?? config.redirectUri,
				response_type: "code",
				response_mode: "query",
				state
			});

			return [url, state] as const;
		},
		validateCallback: async (code: string) => {
			const tokens = await getAppleTokens(code);
			const providerUser = await getAppleUser(tokens.idToken);
			const providerUserId = providerUser.sub;
			const providerAuth = await providerUserAuth(
				auth,
				PROVIDER_ID,
				providerUserId
			);

			return {
				...providerAuth,
				providerUser,
				tokens
			};
		}
	} as const satisfies OAuthProvider;
};

export type AppleUser = {
	email: string;
	email_verified: boolean;
	sub: string;
};
