import { generateRandomString } from "lucia-auth";

import type { Auth, Key, LuciaError } from "lucia-auth";
import type { CreateUserAttributesParameter, LuciaUser } from "./lucia.js";

// deprecate in v2 for better api
export const provider = <
	_Auth extends Auth,
	_ProviderUser extends {},
	_Tokens extends {
		accessToken: string;
	}
>(
	auth: _Auth,
	config: {
		providerId: string;
		getAuthorizationUrl: (state: string) => Promise<URL>;
		getTokens: (code: string) => Promise<_Tokens>;
		getProviderUser: (
			accessToken: string
		) => Promise<
			readonly [providerUserId: string, providerUser: _ProviderUser]
		>;
	}
) => {
	return {
		getAuthorizationUrl: async () => {
			const state = generateState();
			const url = await config.getAuthorizationUrl(state);
			return [url, state] as const;
		},
		validateCallback: async (code: string) => {
			const tokens = await config.getTokens(code);
			const [providerUserId, providerUser] = await config.getProviderUser(
				tokens.accessToken
			);
			const providerAuth = await connectAuth(
				auth,
				config.providerId,
				providerUserId
			);
			return {
				...providerAuth,
				providerUser: providerUser as _ProviderUser,
				providerUserId,
				tokens
			} as const;
		}
	} as const satisfies OAuthProvider<_Auth>;
};

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
		createPersistentKey: (userId: string) => Promise<Key>;
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

export const connectAuth = async <_Auth extends Auth>(
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
		createPersistentKey: async (userId: string) => {
			return await auth.createKey(userId, {
				type: "persistent",
				providerId: providerId,
				providerUserId,
				password: null
			});
		},
		createUser: async (
			attributes: CreateUserAttributesParameter<_Auth>
		): Promise<LuciaUser<_Auth>> => {
			const user = await auth.createUser({
				primaryKey: {
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
