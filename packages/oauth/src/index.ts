import type { User, GlobalUserAttributes } from "lucia-auth";

export interface OAuthProvider {
	validateCallback: (code: string) => Promise<{
		existingUser: User | null;
		createUser: (userAttributes?: GlobalUserAttributes) => Promise<User>;
		providerUser: Record<string, any>;
		[data: string]: any;
	}>;
	getAuthorizationUrl: () => string;
}

export class LuciaOAuthError extends Error {
	constructor(message: string) {
		super(message);
	}
}