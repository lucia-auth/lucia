import type { User, GlobalUserAttributes } from "lucia-auth";
import { generateRandomString } from "lucia-auth";

export interface OAuthProvider {
	validateCallback: (code: string) => Promise<{
		existingUser: User | null;
		createUser: (userAttributes?: GlobalUserAttributes) => Promise<User>;
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
	return generateRandomString(43)
};

export type GetAuthorizationUrlReturnType<T> = T extends null ? [string] : [string, string];
