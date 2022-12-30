import type { Auth } from "lucia-auth";
import { generateRandomString } from "lucia-auth";

export interface OAuthProvider<A extends Auth> {
	validateCallback: (code: string) => Promise<{
		existingUser: GetUserType<A> | null;
		createUser: (
			userAttributes?: Parameters<A["createUser"]>[2] extends {}
				? Parameters<A["createUser"]>[2]["attributes"]
				: undefined
		) => Promise<GetUserType<A>>;
		providerUser: Record<string, any>;
		[data: string]: any;
	}>;
	getAuthorizationUrl: (state?: string | null) => [url: string, state: string] | [url: string];
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

export type GetAuthorizationUrlReturnType<T> = T extends null ? [string] : [string, string];
export type GetUserType<A extends Auth> = Awaited<ReturnType<A["getUser"]>>;
export type GetCreateUserAttributesType<A extends Auth> = Exclude<
	Parameters<A["createUser"]>[2],
	undefined
>["attributes"];
