import type { Key } from "lucia-auth";

export { idToken, passwordToken } from "./tokens.js";

export class Token {
	private readonly value: string;

	public readonly toString = () => this.value;
	public readonly expires: Date | null;
	public readonly isExpired: () => boolean;
	public readonly userId: string;

	constructor(value: string, key: Key) {
		this.value = value;
		this.expires = key.type === "single_use" ? key.expires : null;
		this.isExpired = key.type === "single_use" ? key.isExpired : () => false;
		this.userId = key.userId;
	}
}

export type TokenWrapper = Readonly<{
	issue: (...args: any) => Promise<Token>;
	validate: (...args: any) => Promise<Token>;
	getUserTokens: (userId: string) => Promise<Token[]>;
	invalidateAllUserTokens: (userId: string) => Promise<void>;
	invalidate?: (token: string) => Promise<void>;
}>;
