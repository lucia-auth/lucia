import * as fs from "node:fs/promises";
import * as jose from "jose";

import { createUrl, handleRequest } from "../request.js";
import { generateState, connectAuth } from "../core.js";

import type { Auth } from "lucia-auth";
import type { OAuthConfig, OAuthProvider } from "../core.js";

type AppleConfig = {
	teamId: string;
	keyId: string;
	certificatePath: string;
};

type Config = {
	redirectUri: string;
} & Omit<OAuthConfig, "clientSecret"> &
	AppleConfig;

type AppleTokens = {
	access_token: string;
	refresh_token?: string;
	expires_in: number;
	id_token: string;
};

const PROVIDER_ID = "apple";
const APPLE_AUD = "https://appleid.apple.com";

export const apple = <_Auth extends Auth>(auth: _Auth, config: Config) => {
	const createSecretId = async ({
		certificatePath,
		teamId,
		clientId,
		keyId
	}: AppleConfig & Pick<Config, "clientId">) => {
		const ALG = `ES256`;
		const now = Math.floor(Date.now() / 1000);
		const payload = {
			iss: teamId,
			iat: now,
			exp: now + 60 * 3,
			aud: APPLE_AUD,
			sub: clientId
		};

		const privateKey = await fs.readFile(certificatePath, "utf-8");
		const cert = await jose.importPKCS8(privateKey, ALG);

		const jwt = await new jose.SignJWT(payload)
			.setProtectedHeader({ alg: ALG, kid: keyId })
			.sign(cert);

		return jwt;
	};

	const getTokens = async (code: string) => {
		const requestUrl = createUrl("https://appleid.apple.com/auth/token", {
			client_id: config.clientId,
			client_secret: await createSecretId({
				certificatePath: config.certificatePath,
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

		const tokens = await handleRequest<AppleTokens>(request);

		return {
			accessToken: tokens.access_token,
			refreshToken: tokens.refresh_token ?? null,
			accessTokenExpiresIn: tokens.expires_in,
			idToken: tokens.id_token
		};
	};

	const getProviderUser = async (idToken: string) => {
		const decodeIdToken = jose.decodeJwt(idToken) as AppleUser;
		return {
			email: decodeIdToken.email,
			emailVerified: Boolean(decodeIdToken.email_verified),
			sub: decodeIdToken.sub
		};
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
			const tokens = await getTokens(code);
			const providerUser = await getProviderUser(tokens.idToken);
			const providerUserId = providerUser.sub;
			const providerAuth = await connectAuth(auth, PROVIDER_ID, providerUserId);

			return {
				...providerAuth,
				providerUser,
				tokens
			};
		}
	} as const satisfies OAuthProvider<_Auth>;
};

export type AppleUser = {
	email: string;
	email_verified: boolean;
	sub: string;
};
