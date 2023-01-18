import type { Auth } from "lucia-auth";
import { generateRandomString } from "lucia-auth";

export interface OAuthProvider<A extends Auth> {
	validateCallback: (code: string) => Promise<{
		existingUser: LuciaUser<A> | null;
		createUser: CreateUser<A>;
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
export type CreateUser<A extends Auth> = Parameters<
	A["createUser"]
>[2] extends {}
	? (userAttributes: CreateUserAttributes<A>) => Promise<LuciaUser<A>>
	: () => Promise<LuciaUser<A>>;
type CreateUserAttributes<A extends Auth> = Parameters<
	A["createUser"]
>[2] extends {}
	? Parameters<A["createUser"]>[2]["attributes"]
	: undefined;
