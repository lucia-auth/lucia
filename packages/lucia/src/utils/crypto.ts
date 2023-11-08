import { encodeHex, decodeHex } from "oslo/encoding";
import { constantTimeEqual } from "oslo/crypto";
import { scrypt } from "../scrypt/index.js";
import { alphabet, generateRandomString } from "oslo/random";

export const generateScryptHash = async (s: string): Promise<string> => {
	const salt = encodeHex(crypto.getRandomValues(new Uint8Array(16)));
	const key = await generateScryptKey(s.normalize("NFKC"), salt);
	return `s2:${salt}:${encodeHex(key)}`;
};

const generateScryptKey = async (
	s: string,
	salt: string,
	blockSize = 16
): Promise<ArrayBuffer> => {
	const keyUint8Array = await scrypt(
		new TextEncoder().encode(s),
		new TextEncoder().encode(salt),
		{
			N: 16384,
			r: blockSize,
			p: 1,
			dkLen: 64
		}
	);
	return keyUint8Array;
};

export const verifyScryptHash = async (
	s: string,
	hash: string
): Promise<boolean> => {
	const arr = hash.split(":");
	if (arr.length === 2) {
		const [salt, key] = arr;
		const targetKey = await generateScryptKey(s.normalize("NFKC"), salt, 8);
		const result = constantTimeEqual(targetKey, decodeHex(key));
		return result;
	}
	if (arr.length !== 3) return false;
	const [version, salt, key] = arr;
	if (version === "s2") {
		const targetKey = await generateScryptKey(s.normalize("NFKC"), salt);
		return constantTimeEqual(targetKey, decodeHex(key));
	}
	return false;
};

export function generateId(length: number): string {
	return generateRandomString(length, alphabet("0-9", "a-z"));
}
