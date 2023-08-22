import { createUrl, handleRequest } from "../utils/request.js";
import { encodeBase64, encodeBase64Url } from "../utils/encode.js";
import { generateRandomString } from "lucia/utils";

import type { ProviderUserAuth } from "./provider.js";

export abstract class OAuth2ProviderAuth<
	_ProviderUserAuth extends ProviderUserAuth = ProviderUserAuth,
	_Auth = _ProviderUserAuth extends ProviderUserAuth<infer _Auth>
		? _Auth
		: never
> {
	protected auth: _Auth;

	constructor(auth: _Auth) {
		this.auth = auth;
	}

	abstract validateCallback: (code: string) => Promise<_ProviderUserAuth>;
	abstract getAuthorizationUrl: () => Promise<
		readonly [url: URL, state: string | null]
	>;
}

export abstract class OAuth2ProviderAuthWithPKCE<
	_ProviderUserAuth extends ProviderUserAuth = ProviderUserAuth,
	_Auth = _ProviderUserAuth extends ProviderUserAuth<infer _Auth>
		? _Auth
		: never
> {
	protected auth: _Auth;

	constructor(auth: _Auth) {
		this.auth = auth;
	}

	abstract validateCallback: (
		code: string,
		codeVerifier: string
	) => Promise<_ProviderUserAuth>;
	abstract getAuthorizationUrl: () => Promise<
		readonly [url: URL, codeVerifier: string, state: string | null]
	>;
}

export const createOAuth2AuthorizationUrl = async (
	url: string | URL,
	options: {
		clientId: string;
		scope: string[];
		redirectUri?: string;
	}
): Promise<readonly [authorizationUrl: URL, state: string]> => {
	const state = generateState();
	const authorizationUrl = createUrl(url, {
		response_type: "code",
		client_id: options.clientId,
		scope: options.scope.join(" "),
		state,
		redirect_uri: options.redirectUri
	});
	return [authorizationUrl, state] as const;
};

export const createOAuth2AuthorizationUrlWithPKCE = async (
	url: string | URL,
	options: {
		clientId: string;
		scope: string[];
		codeChallengeMethod: "S256";
		redirectUri?: string;
	}
): Promise<
	readonly [authorizationUrl: URL, codeVerifier: string, state: string]
> => {
	const codeVerifier = generateRandomString(
		96,
		"abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890-_.~"
	);
	const codeChallenge = await generatePKCECodeChallenge("S256", codeVerifier);
	const state = generateState();
	const authorizationUrl = createUrl(url, {
		response_type: "code",
		client_id: options.clientId,
		scope: options.scope.join(" "),
		state,
		redirect_uri: options.redirectUri,
		code_challenge_method: "S256",
		code_challenge: codeChallenge
	});
	return [authorizationUrl, codeVerifier, state] as const;
};

export const validateOAuth2AuthorizationCode = async <_ResponseBody extends {}>(
	authorizationCode: string,
	url: string | URL,
	options: {
		clientId: string;
		redirectUri?: string;
		codeVerifier?: string;
		clientPassword?: {
			clientSecret: string;
			authenticateWith: "client_secret" | "http_basic_auth";
		};
	}
): Promise<_ResponseBody> => {
	const body = new URLSearchParams({
		code: authorizationCode,
		client_id: options.clientId,
		grant_type: "authorization_code"
	});
	if (options.redirectUri) {
		body.set("redirect_uri", options.redirectUri);
	}
	if (options.codeVerifier) {
		body.set("code_verifier", options.codeVerifier);
	}
	if (
		options.clientPassword &&
		options.clientPassword.authenticateWith === "client_secret"
	) {
		body.set("client_secret", options.clientPassword.clientSecret);
	}

	const headers = new Headers({
		"Content-Type": "application/x-www-form-urlencoded"
	});
	if (
		options.clientPassword &&
		options.clientPassword.authenticateWith === "http_basic_auth"
	) {
		headers.set(
			"Authorization",
			encodeBase64(`${options.clientId}:${options.clientPassword.clientSecret}`)
		);
	}

	const request = new Request(new URL(url), {
		method: "POST",
		headers,
		body
	});
	return await handleRequest<_ResponseBody>(request);
};
export const generateState = () => {
	return generateRandomString(43);
};

// Generates code_challenge from code_verifier, as specified in RFC 7636.
export const generatePKCECodeChallenge = async (
	method: "S256",
	verifier: string
) => {
	if (method === "S256") {
		const verifierBuffer = new TextEncoder().encode(verifier);
		const challengeBuffer = await crypto.subtle.digest(
			"SHA-256",
			verifierBuffer
		);
		return encodeBase64Url(challengeBuffer);
	}
	throw new TypeError("Invalid PKCE code challenge method");
};
