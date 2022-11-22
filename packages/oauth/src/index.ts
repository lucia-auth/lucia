import type { User, GlobalUserAttributes } from "lucia-auth";

export interface OAuthProvider {
	validateCallback: (code: string) => Promise<{
		existingUser: User | null;
		createUser: (userAttributes?: GlobalUserAttributes) => Promise<User>;
		providerUser: Record<string, any>;
		[data: string]: any;
	}>;
	getAuthorizationUrl: (state?: string) => [url: string, state: string | undefined];
}

export interface OAuthConfig {
	clientId: string;
	clientSecret: string;
	scope?: string[];
	state?: boolean;
}

export class LuciaOAuthError extends Error {
	constructor(message: string) {
		super(message);
	}
}

export const generateState = () => {
	const validChars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
	let array = new Uint8Array(43);

	array = crypto.getRandomValues(array);
	array = array.map((x) => validChars.charCodeAt(x % validChars.length));

	const state = String.fromCharCode.apply(null, [...array]);
	return state;
};
