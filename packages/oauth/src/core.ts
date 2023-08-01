import { createUrl, handleRequest } from "./request.js";
import {
	encodeBase64,
	generateState,
	encodeBase64Url,
	generatePKCECodeChallenge,
	decodeBase64Url
} from "./utils.js";
import { generateRandomString } from "lucia/utils";

import type { Auth, Key, LuciaError } from "lucia";
import type { LuciaDatabaseUserAttributes, LuciaUser } from "./lucia.js";

export type OAuthConfig = {
	clientId: string;
	clientSecret: string;
	scope?: string[];
};

export type OAuthProvider<_Auth extends Auth = Auth> = {
	validateCallback: (
		code: string,
		...args: any[]
	) => Promise<ProviderUserAuth<_Auth>>;
	getAuthorizationUrl: (
		redirectUri?: string
	) => Promise<readonly [URL, ...any[]]>;
};

export class OAuthRequestError extends Error {
	public request: Request;
	public response: Response;
	public message = "OAUTH_REQUEST_FAILED" as const;
	constructor(request: Request, response: Response) {
		super("OAUTH_REQUEST_FAILED");
		this.request = request;
		this.response = response;
	}
}

type ProviderUserAuth<_Auth extends Auth> = {
	existingUser: LuciaUser<_Auth> | null;
	createKey: (userId: string) => Promise<Key>;
	createUser: (options: {
		userId?: string;
		attributes: LuciaDatabaseUserAttributes<_Auth>;
	}) => Promise<LuciaUser<_Auth>>;
};

export const providerUserAuth = async <_Auth extends Auth>(
	auth: _Auth,
	providerId: string,
	providerUserId: string
): Promise<ProviderUserAuth<_Auth>> => {
	const getExistingUser = async () => {
		try {
			const key = await auth.useKey(providerId, providerUserId, null);
			const user = await auth.getUser(key.userId);
			return user as LuciaUser<_Auth>;
		} catch (e) {
			const error = e as Partial<LuciaError>;
			if (error?.message !== "AUTH_INVALID_KEY_ID") throw e;
			return null;
		}
	};
	const existingUser = await getExistingUser();
	return {
		existingUser,
		createKey: async (userId: string) => {
			return await auth.createKey({
				userId,
				providerId: providerId,
				providerUserId,
				password: null
			});
		},
		createUser: async (options: {
			userId?: string;
			attributes: LuciaDatabaseUserAttributes<_Auth>;
		}): Promise<LuciaUser<_Auth>> => {
			const user = await auth.createUser({
				key: {
					providerId: providerId,
					providerUserId,
					password: null
				},
				...options
			});
			return user as LuciaUser<_Auth>;
		}
	} as const;
};

export const createOAuth2AuthorizationUrl = async (
	url: string | URL,
	options: {
		clientId: string;
		scope: string[];
		state?: string;
		redirectUri?: string;
		searchParams?: Record<string, string | undefined>;
	}
): Promise<readonly [authorizationUrl: URL, state: string]> => {
	const searchParams = options.searchParams ?? {};
	const state = generateState();
	const authorizationUrl = createUrl(url, {
		response_type: "code",
		client_id: options.clientId,
		scope: options.scope.join(" "),
		state: options.state ?? state,
		redirect_url: options.redirectUri,
		...searchParams
	});
	return [authorizationUrl, state] as const;
};

export const createOAuth2AuthorizationUrlWithPKCE = async (
	url: string | URL,
	options: {
		clientId: string;
		scope: string[];
		codeChallengeMethod: "S256";
		state?: string;
		redirectUri?: string;
		searchParams?: Record<string, string | undefined>;
	}
): Promise<
	readonly [authorizationUrl: URL, state: string, codeVerifier: string]
> => {
	const searchParams = options.searchParams ?? {};
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
		state: options.state ?? state,
		redirect_url: options.redirectUri,
		code_challenge_method: "S256",
		code_challenge: encodeBase64Url(codeChallenge),
		...searchParams
	});
	return [authorizationUrl, state, codeVerifier] as const;
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

export class IdTokenError extends Error {
	public message: "INVALID_ID_TOKEN";
	constructor(message: IdTokenError["message"]) {
		super(message);
		this.message = message;
	}
}

const decoder = new TextDecoder();

// does not verify id tokens
export const decodeIdToken = <_Claims extends {}>(
	idToken: string
): {
	iss: string;
	aud: string;
	exp: number;
} & _Claims => {
	const idTokenParts = idToken.split(".");
	if (idTokenParts.length !== 3) throw new IdTokenError("INVALID_ID_TOKEN");
	const base64UrlPayload = idTokenParts[1];
	const payload: unknown = JSON.parse(
		decoder.decode(decodeBase64Url(base64UrlPayload))
	);
	if (!payload || typeof payload !== "object") {
		throw new IdTokenError("INVALID_ID_TOKEN");
	}
	return payload as {
		iss: string;
		aud: string;
		exp: number;
	} & _Claims;
};
