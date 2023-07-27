import { authorizationHeader, handleRequest } from "./request.js";
import { encodeBase64 } from "./utils.js";

import type { Auth, Key, LuciaError } from "lucia";
import type { CreateUserAttributesParameter, LuciaUser } from "./lucia.js";

export type OAuthConfig = {
	clientId: string;
	clientSecret: string;
	scope?: string[];
};

export type OAuthProvider = {
	validateCallback: (
		code: string,
		...args: any[]
	) => Promise<{
		existingUser: Record<any, any> | null;
		createUser: (options: {
			userId?: string;
			attributes: Record<string, any>;
		}) => Promise<Record<any, any>>;
		createKey: (userId: string) => Promise<Key>;
	}>;
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

export const providerUserAuth = async <_Auth extends Auth>(
	auth: _Auth,
	providerId: string,
	providerUserId: string
) => {
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
			attributes: CreateUserAttributesParameter<_Auth>;
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
) => {
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
