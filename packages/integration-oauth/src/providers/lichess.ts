import { createUrl, handleRequest, authorizationHeaders } from "../request.js";
import { scope, provider, generateState, connectAuth } from "../core.js";

import type { Auth } from "lucia-auth";
import type { OAuthConfig, OAuthProvider } from "../core.js";

type Config = OAuthConfig & {
	redirectUri: string;
};

const PROVIDER_ID = "lichess";

// TODO: PKCE_VERIFIER should be generated with state.
const PKCE_CODE_VERIFIER =
	"XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX";

export const lichess = <_Auth extends Auth>(auth: _Auth, config: Config) => {
	const getAuthorizationUrl = async () => {
		const state = generateState();
		const url = createUrl("https://lichess.org/oauth", {
			response_type: "code",
			client_id: config.clientId,
			code_challenge_method: "S256",
			code_challenge: pkceBase64urlEncode(
				await pkceCodeChallenge(PKCE_CODE_VERIFIER)
			),
			scope: scope([], config.scope),
			redirect_uri: config.redirectUri,
			state
		});
		return [url, state] as const;
	};

	const getTokens = async (code: string) => {
		// Not using createUrl since we need to POST
		const request = new Request("https://lichess.org/api/token", {
			method: "POST",
			headers: {
				"Content-Type": "application/x-www-form-urlencoded"
			},
			body: new URLSearchParams({
				client_id: config.clientId,
				grant_type: "authorization_code",
				redirect_uri: config.redirectUri,
				code_verifier: PKCE_CODE_VERIFIER,
				code
			}).toString()
		});
		const tokens = await handleRequest<{
			access_token: string;
			expires_in: number;
		}>(request);

		return {
			accessToken: tokens.access_token,
			accessTokenExpiresIn: tokens.expires_in
		};
	};

	const getProviderUser = async (accessToken: string) => {
		const request = new Request("https://lichess.org/api/account", {
			headers: authorizationHeaders("bearer", accessToken)
		});
		const lichessUser = await handleRequest<LichessUser>(request);
		return lichessUser;
	};

	const validateCallback = async (code: string) => {
		const tokens = await getTokens(code);
		const providerUser = await getProviderUser(tokens.accessToken);
		const providerUserId = providerUser.id;
		const providerAuth = await connectAuth(auth, PROVIDER_ID, providerUserId);
		return {
			...providerAuth,
			providerUser,
			tokens
		};
	}

	// Base64url-encode as specified in RFC 7636 (OAuth PKCE).
	const pkceBase64urlEncode = (arg: string) => {
		return btoa(arg).split("=")[0].replace(/\+/g, "-").replace(/\//g, "_");
	};

	// Generates code_challenge from code_verifier, as specified in RFC 7636.
	const pkceCodeChallenge = async (verifier: string) => {
		const verifierBuffer = new TextEncoder().encode(verifier);
		const challengeBuffer = await crypto.subtle.digest(
			"SHA-256",
			verifierBuffer
		);
		const challengeArray = Array.from(new Uint8Array(challengeBuffer));
		return String.fromCharCode(...challengeArray);
	};

	return {
		getAuthorizationUrl,
		validateCallback
	} as const satisfies OAuthProvider<_Auth>;
};

export type LichessUser = {
	id: string;
	username: string;
};
