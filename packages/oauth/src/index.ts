import type { Auth, Key } from "lucia-auth";
import { generateRandomString } from "lucia-auth";

export interface OAuthProvider<A extends Auth> {
	validateCallback: (code: string) => Promise<{
		existingUser: LuciaUser<A> | null;
		createUser: (
			attributes: CreateUserAttributesParameter<A>
		) => Promise<LuciaUser<A>>;
		addKey: (userId: string) => Promise<Key>;
		providerUser: Record<string, any>;
		[data: string]: any;
	}>;
	getAuthorizationUrl: (
		state?: string | null
	) => [url: string, state: string] | [url: string];
}

export interface OAuthConfig {
	clientId: string;
	clientSecret: string;
	scope?: string[];
}

export class LuciaOAuthError extends Error {
	constructor(message: string) {
		super(message);
	}
}

export const generateState = () => {
	return generateRandomString(43);
};

export type GetAuthorizationUrlReturnType<T> = T extends null
	? [string]
	: [string, string];

export type LuciaUser<A extends Auth> = Awaited<ReturnType<A["getUser"]>>;

export type CreateUserAttributesParameter<A extends Auth> = Parameters<
	A["createUser"]
>[0]["attributes"];
