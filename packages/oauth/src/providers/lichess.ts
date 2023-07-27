import { createUrl, handleRequest, authorizationHeader } from "../request.js";
import { providerUserAuth, validateOAuth2AuthorizationCode } from "../core.js";
import { scope, generateState, encodeBase64 } from "../utils.js";
import { generateRandomString } from "lucia/utils";

import type { Auth } from "lucia";
import type { OAuthConfig, OAuthProvider } from "../core.js";

type Config = Omit<OAuthConfig, "clientSecret"> & {
	redirectUri: string;
};

const PROVIDER_ID = "lichess";

export const lichess = <_Auth extends Auth>(auth: _Auth, config: Config) => {
	const getAuthorizationUrl = async () => {
		const state = generateState();
		// PKCE code verifier length and alphabet defined in RFC 7636 section 4.1
		const codeVerifier = generateRandomString(
			96,
			"abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890-_.~"
		);
		const url = createUrl("https://lichess.org/oauth", {
			response_type: "code",
			client_id: config.clientId,
			code_challenge_method: "S256",
			code_challenge: pkceBase64urlEncode(
				await pkceCodeChallenge(codeVerifier)
			),
			scope: scope([], config.scope),
			redirect_uri: config.redirectUri,
			state
		});
		return [url, state, codeVerifier] as const;
	};

	const getLichessTokens = async (code: string, codeVerifier: string) => {
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

	const getLichessUser = async (accessToken: string) => {
		const request = new Request("https://lichess.org/api/account", {
			headers: {
				Authorization: authorizationHeader("bearer", accessToken)
			}
		});
		const lichessUser = await handleRequest<LichessUser>(request);
		return lichessUser;
	};

	const validateCallback = async (code: string, code_verifier: string) => {
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
	};

	return {
		getAuthorizationUrl,
		validateCallback
	} as const satisfies OAuthProvider;
};

export type LichessUser = {
	id: string;
	username: string;
};

// Base64url-encode as specified in RFC 7636 (OAuth PKCE).
const pkceBase64urlEncode = (arg: string) => {
	return encodeBase64(arg)
		.split("=")[0]
		.replace(/\+/g, "-")
		.replace(/\//g, "_");
};

// Generates code_challenge from code_verifier, as specified in RFC 7636.
const pkceCodeChallenge = async (verifier: string) => {
	const verifierBuffer = new TextEncoder().encode(verifier);
	const challengeBuffer = await crypto.subtle.digest("SHA-256", verifierBuffer);
	const challengeArray = Array.from(new Uint8Array(challengeBuffer));
	return String.fromCharCode(...challengeArray);
};
