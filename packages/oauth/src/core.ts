import { generateRandomString } from "lucia/utils";

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
		createUser: (attributes: Record<string, any>) => Promise<Record<any, any>>;
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

export const generateState = () => {
	return generateRandomString(43);
};

export const encodeBase64 = (s: string) => {
	// ORDER IS IMPORTANT!!
	// Buffer API EXISTS IN DENO!!
	if (typeof window !== "undefined" && "Deno" in window) {
		// deno
		return btoa(s);
	}
	if (typeof Buffer === "function") {
		// node
		return Buffer.from(s).toString("base64");
	}

	// standard API
	// IGNORE WARNING
	return btoa(s);
};

export const scope = (base: string[], config: string[] = []) => {
	return [...base, ...(config ?? [])].join(" ");
};

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
			return await auth.createKey(userId, {
				providerId: providerId,
				providerUserId,
				password: null
			});
		},
		createUser: async (
			attributes: CreateUserAttributesParameter<_Auth>
		): Promise<LuciaUser<_Auth>> => {
			const user = await auth.createUser({
				key: {
					providerId: providerId,
					providerUserId,
					password: null
				},
				attributes
			});
			return user as LuciaUser<_Auth>;
		}
	} as const;
};
