import { generateRandomString } from "lucia-auth";

import type { Auth, Key, LuciaError } from "lucia-auth";
import type { CreateUserAttributesParameter, LuciaUser } from "./lucia.js";
import { AwaitedReturnType } from "./utils.js";

export const provider = <
	A extends Auth,
	GetProviderUser extends (
		accessToken: string
	) => Promise<readonly [providerUserId: string, providerUser: {}]>
>(
	auth: A,
	config: {
		providerId: string;
		getAuthorizationUrl: (state: string) => Promise<URL>;
		getTokens: (code: string) => Promise<{
			accessToken: string;
		}>;
		getProviderUser: GetProviderUser;
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
			const getExistingUser = async () => {
				try {
					const { user } = await auth.getKeyUser(
						config.providerId,
						providerUserId
					);
					return user as LuciaUser<A>;
				} catch (e) {
					const error = e as Partial<LuciaError>;
					if (error?.message !== "AUTH_INVALID_KEY_ID") throw e;
					return null;
				}
			};
			const existingUser = await getExistingUser();
			return {
				providerUser: providerUser as AwaitedReturnType<GetProviderUser>[1],
				providerUserId,
				createKey: async (userId: string) => {
					return await auth.createKey(userId, {
						providerId: config.providerId,
						providerUserId,
						password: null
					});
				},
				createUser: async (
					attributes: CreateUserAttributesParameter<A>
				): Promise<LuciaUser<A>> => {
					const user = await auth.createUser({
						key: {
							providerId: config.providerId,
							providerUserId,
							password: null
						},
						attributes
					});
					return user as LuciaUser<A>;
				},
				existingUser,
				tokens
			} as const;
		}
	} as const satisfies OAuthProvider<A>;
};

export type OAuthConfig = {
	clientId: string;
	clientSecret: string;
	scope?: string[];
};

export type OAuthProvider<A extends Auth> = {
	validateCallback: (code: string) => Promise<{
		existingUser: LuciaUser<A> | null;
		createUser: (
			attributes: CreateUserAttributesParameter<A>
		) => Promise<LuciaUser<A>>;
		createKey: (userId: string) => Promise<Key>;
		providerUser: Record<string, any>;
		tokens: Record<any, any>;
	}>;
	getAuthorizationUrl: () => Promise<readonly [url: URL, state: string]>;
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
