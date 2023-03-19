import type { SingleUseKey } from "lucia-auth";

export { idToken, passwordToken } from "./tokens.js";
export { LuciaTokenError } from "./error.js";

export class Token {
	private readonly value: string;

	public readonly toString = () => this.value;
	public readonly expires: Date;
	public readonly isExpired: boolean;
	public readonly userId: string;

	constructor(value: string, key: SingleUseKey) {
		this.value = value;
		this.expires = key.expires;
		this.isExpired = key.isExpired;
		this.userId = key.userId;
	}
}
