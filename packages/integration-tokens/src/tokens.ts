import { customAlphabet } from "nanoid";
import { Token, TokenWrapper } from "./index.js";
import { generateRandomString } from "lucia-auth";

import type { Auth, SingleUseKey } from "lucia-auth";

export const idToken = (
	auth: Auth,
	name: string,
	options: {
		timeout: number | null;
		length?: number;
		generate?: (length?: number) => string;
	}
) => {
	return {
		issue: async (userId: string) => {
			const generate = options.generate ?? generateRandomString;
			const token = generate(options.length ?? 43);
			const key = await auth.createKey(userId, {
				type: "single_use",
				providerId: name,
				providerUserId: token,
				password: null,
				timeout: options.timeout
			});
			return new Token(token, key);
		},
		validate: async (token: string) => {
			const key = await auth.useKey(name, token, null);
			return new Token(token, key);
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
			const keys = await auth.getAllUserKeys(userId);
			const targetKeys = keys.filter((key) => key.providerId === name);
			await Promise.all(
				targetKeys.map((key) =>
					auth.deleteKey(key.providerId, key.providerUserId)
				)
			);
		}
	} as const satisfies TokenWrapper;
};

export const passwordToken = (
	auth: Auth,
	name: string,
	options: {
		timeout: number | null;
		length?: number;
		generate?: (length?: number) => string;
	}
) => {
	const generateRandomNumberString = customAlphabet("0123456789", 8);
	return {
		issue: async (userId: string) => {
			const generate = options.generate ?? generateRandomNumberString;
			const token = generate(options.length ?? 8);
			const providerUserId = [userId, token].join(".");
			const key = await auth.createKey(userId, {
				type: "single_use",
				providerId: name,
				providerUserId: providerUserId,
				password: null,
				timeout: options.timeout
			});
			return new Token(token, key);
		},
		validate: async (token: string, userId: string) => {
			const providerUserId = [userId, token].join(".");
			const key = await auth.useKey(name, providerUserId, null);
			return new Token(token, key);
		},
		getUserTokens: async (userId: string) => {
			const keys = await auth.getAllUserKeys(userId);
			const tokenKeys = keys.filter((key): key is SingleUseKey => {
				if (!key.providerUserId.includes(".")) return false;
				return key.type === "single_use" && key.providerId === name;
			});
			return tokenKeys.map((key) => {
				const [_userId, token] = key.providerUserId.split(".");
				return new Token(token, key);
			});
		},
		invalidateAllUserTokens: async (userId: string) => {
			const keys = await auth.getAllUserKeys(userId);
			const targetKeys = keys.filter((key) => key.providerId === name);
			await Promise.all(
				targetKeys.map((key) =>
					auth.deleteKey(key.providerId, key.providerUserId)
				)
			);
		}
	} as const satisfies TokenWrapper;
};
