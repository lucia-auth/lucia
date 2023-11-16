import { encodeHex, decodeHex } from "oslo/encoding";
import { constantTimeEqual } from "oslo/crypto";
import { scrypt } from "./scrypt/index.js";
import { alphabet, generateRandomString } from "oslo/random";

import type { PasswordHashingAlgorithm } from "oslo/password";
export type { PasswordHashingAlgorithm } from "oslo/password";

async function generateScryptKey(s: string, salt: string, blockSize = 16): Promise<ArrayBuffer> {
	const keyUint8Array = await scrypt(new TextEncoder().encode(s), new TextEncoder().encode(salt), {
		N: 16384,
		r: blockSize,
		p: 1,
		dkLen: 64
	});
	return keyUint8Array;
}

export function generateId(length: number): string {
	return generateRandomString(length, alphabet("0-9", "a-z"));
}

export class Scrypt implements PasswordHashingAlgorithm {
	async hash(password: string): Promise<string> {
		const salt = encodeHex(crypto.getRandomValues(new Uint8Array(16)));
		const key = await generateScryptKey(password.normalize("NFKC"), salt);
		return `${salt}:${encodeHex(key)}`;
	}
	async verify(hash: string, password: string): Promise<boolean> {
		const parts = hash.split(":");
		if (parts.length !== 2) return false;

		const [salt, key] = parts;
		const targetKey = await generateScryptKey(password.normalize("NFKC"), salt);
		return constantTimeEqual(targetKey, decodeHex(key));
	}
}

export class LegacyScrypt implements PasswordHashingAlgorithm {
	async hash(password: string): Promise<string> {
		const salt = encodeHex(crypto.getRandomValues(new Uint8Array(16)));
		const key = await generateScryptKey(password.normalize("NFKC"), salt);
		return `${salt}:${encodeHex(key)}`;
	}
	async verify(hash: string, password: string): Promise<boolean> {
		const parts = hash.split(":");
		if (parts.length === 2) {
			const [salt, key] = parts;
			const targetKey = await generateScryptKey(password.normalize("NFKC"), salt, 8);
			const result = constantTimeEqual(targetKey, decodeHex(key));
			return result;
		}
		if (parts.length !== 3) return false;
		const [version, salt, key] = parts;
		if (version === "s2") {
			const targetKey = await generateScryptKey(password.normalize("NFKC"), salt);
			return constantTimeEqual(targetKey, decodeHex(key));
		}
		return false;
	}
}
