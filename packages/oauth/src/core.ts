import { generateRandomString } from "lucia/utils";

import type { Auth, Key, LuciaError } from "lucia";
import type { CreateUserAttributesParameter, LuciaUser } from "./lucia.js";

export type OAuthConfig = {
	clientId: string;
	clientSecret: string;
	scope?: string[];
};

export type OAuthProvider<A extends Auth> = {
	validateCallback: (
		code: string,
		...args: any[]
	) => Promise<{
		existingUser: LuciaUser<A> | null;
		createUser: (
			attributes: CreateUserAttributesParameter<A>
		) => Promise<LuciaUser<A>>;
		createKey: (userId: string) => Promise<Key>;
		providerUser: Record<string, any>;
		tokens: {
			accessToken: string;
		};
	}>;
	getAuthorizationUrl: (
		redirectUri?: string
	) => Promise<readonly [URL, ...any[]]>;
};

export class LuciaOAuthRequestError extends Error {
	public status;
	public body;
	constructor(status: number, body: Record<string, any> | null) {
		super("REQUEST_FAILED");
		this.status = status;
		this.body = body;
	}
}

export const generateState = () => {
	return generateRandomString(43);
};

export const scope = (base: string[], config: string[] = []) => {
	return [...base, ...(config ?? [])].join(" ");
};

export const useAuth = async <_Auth extends Auth>(
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
