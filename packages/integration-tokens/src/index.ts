import type { SingleUseKey } from "lucia-auth";

export { idToken, passwordToken } from "./tokens.js";
export { LuciaTokenError } from "./error.js";

export class Token {
	private readonly value: string;

	public readonly toString = () => this.value;
	public readonly expiresAt: Date;
	public readonly expired: boolean;
	public readonly userId: string;
	public readonly key: Readonly<SingleUseKey>;

	constructor(value: string, key: SingleUseKey) {
		this.value = value;
		this.expiresAt = key.expiresAt;
		this.expired = key.expired;
		this.userId = key.userId;
		this.key = key;
	}
}
