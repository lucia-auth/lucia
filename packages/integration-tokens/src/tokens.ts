import { LuciaTokenError } from "./error.js";
import { generateRandomString } from "./utils/nanoid.js";

import type { Auth, SingleUseKey, LuciaError } from "lucia-auth";

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

type TokenWrapper = Readonly<{
	issue: (...args: any) => Promise<Token>;
	validate: (...args: any) => Promise<Token>;
	getUserTokens: (userId: string) => Promise<Token[]>;
	invalidateAllUserTokens: (userId: string) => Promise<void>;
	invalidate?: (token: string) => Promise<void>;
}>;

export const idToken = (
	auth: Auth,
	name: string,
	options: {
		expiresIn: number;
		length?: number;
		generate?: (length?: number) => string;
	}
) => {
	return {
		issue: async (userId: string) => {
			const generate = options.generate ?? generateRandomString;
			const token = generate(options.length ?? 43);
			try {
				const key = await auth.createKey(userId, {
					type: "single_use",
					providerId: name,
					providerUserId: token,
					password: null,
					expiresIn: options.expiresIn
				});
				return new Token(token, key);
			} catch (e) {
				const error = e as Partial<LuciaError>;
				if (error.message === "AUTH_INVALID_USER_ID")
					throw new LuciaTokenError("INVALID_USER_ID");
				if (error.message === "AUTH_DUPLICATE_KEY_ID")
					throw new LuciaTokenError("DUPLICATE_TOKEN");
				throw e;
			}
		},
		validate: async (token: string) => {
			try {
				const key = await auth.useKey(name, token, null);
				if (key.type !== "single_use")
					throw new LuciaTokenError("INVALID_TOKEN");
				return new Token(token, key);
			} catch (e) {
				const error = e as Partial<LuciaError>;
				if (error.message === "AUTH_INVALID_KEY_ID")
					throw new LuciaTokenError("INVALID_TOKEN");
				if (error.message === "AUTH_EXPIRED_KEY")
					throw new LuciaTokenError("EXPIRED_TOKEN");
				throw e;
			}
		},
		getUserTokens: async (userId: string) => {
			const keys = await auth.getAllUserKeys(userId);
			const targetKeys = keys.filter((key): key is SingleUseKey => {
				return key.type === "single_use" && key.providerId === name;
			});
			return targetKeys.map((key) => {
				return new Token(key.providerUserId, key);
			});
		},
		invalidate: async (token: string) => {
			await auth.deleteKey(name, token);
		},
		invalidateAllUserTokens: async (userId: string) => {
			try {
				const keys = await auth.getAllUserKeys(userId);
				const targetKeys = keys.filter((key) => key.providerId === name);
				await Promise.all(
					targetKeys.map((key) =>
						auth.deleteKey(key.providerId, key.providerUserId)
					)
				);
			} catch (e) {
				const error = e as Partial<LuciaError>;
				// ignore invalid user id to be consistent with similar Lucia APIs
				if (error.message === "AUTH_INVALID_USER_ID") return;
				throw e;
			}
		}
	} as const satisfies TokenWrapper;
};

export const passwordToken = (
	auth: Auth,
	name: string,
	options: {
		expiresIn: number;
		length?: number;
		generate?: (length?: number) => string;
	}
) => {
	const defaultGenerateRandomPassword = (length: number) => {
		return generateRandomString(length, "0123456789");
	};
	return {
		issue: async (userId: string) => {
			const generate = options.generate ?? defaultGenerateRandomPassword;
			const token = generate(options.length ?? 8);
			const providerUserId = [userId, token].join(".");
			try {
				const key = await auth.createKey(userId, {
					type: "single_use",
					providerId: name,
					providerUserId: providerUserId,
					password: null,
					expiresIn: options.expiresIn
				});
				return new Token(token, key);
			} catch (e) {
				const error = e as Partial<LuciaError>;
				if (error.message === "AUTH_INVALID_USER_ID")
					throw new LuciaTokenError("INVALID_USER_ID");
				if (error.message === "AUTH_DUPLICATE_KEY_ID")
					throw new LuciaTokenError("DUPLICATE_TOKEN");
				throw e;
			}
		},
		validate: async (token: string, userId: string) => {
			const providerUserId = [userId, token].join(".");
			try {
				const key = await auth.useKey(name, providerUserId, null);
				if (key.type !== "single_use")
					throw new LuciaTokenError("INVALID_TOKEN");
				return new Token(token, key);
			} catch (e) {
				const error = e as Partial<LuciaError>;
				if (error.message === "AUTH_INVALID_KEY_ID")
					throw new LuciaTokenError("INVALID_TOKEN");
				if (error.message === "AUTH_EXPIRED_KEY")
					throw new LuciaTokenError("EXPIRED_TOKEN");
				throw e;
			}
		},
		getUserTokens: async (userId: string) => {
			try {
				const keys = await auth.getAllUserKeys(userId);
				const tokenKeys = keys.filter((key): key is SingleUseKey => {
					if (!key.providerUserId.includes(".")) return false;
					return key.type === "single_use" && key.providerId === name;
				});
				return tokenKeys.map((key) => {
					const [_userId, token] = key.providerUserId.split(".");
					return new Token(token, key);
				});
			} catch (e) {
				const error = e as Partial<LuciaError>;
				if (error.message === "AUTH_INVALID_USER_ID")
					throw new LuciaTokenError("INVALID_USER_ID");
				throw e;
			}
		},
		invalidateAllUserTokens: async (userId: string) => {
			try {
				const keys = await auth.getAllUserKeys(userId);
				const targetKeys = keys.filter((key) => key.providerId === name);
				await Promise.all(
					targetKeys.map((key) =>
						auth.deleteKey(key.providerId, key.providerUserId)
					)
				);
			} catch (e) {
				const error = e as Partial<LuciaError>;
				// ignore invalid user id to be consistent with similar Lucia APIs
				if (error.message === "AUTH_INVALID_USER_ID") return;
				throw e;
			}
		}
	} as const satisfies TokenWrapper;
};
