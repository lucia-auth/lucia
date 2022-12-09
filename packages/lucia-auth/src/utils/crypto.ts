import { random, customRandom } from "nanoid";
import { scryptAsync } from "@noble/hashes/scrypt";

export const generateRandomString = (length: number) => {
	const characters = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890";
	return customRandom(characters, length, random)();
};

export const generateHashWithScrypt = async (s: string) => {
	const salt = generateRandomString(16);
	const key = await scrypt(s.normalize("NFKC"), salt);
	return `s2:${salt}:${key}`;
};

const scrypt = async (s: string, salt: string, blockSize = 16) => {
	const keyUint8Array = await scryptAsync(
		new TextEncoder().encode(s),
		new TextEncoder().encode(salt),
		{
			N: 16384,
			r: blockSize,
			p: 1,
			dkLen: 64
		}
	);
	return convertUint8ArrayToHex(keyUint8Array);
};

export const validateScryptHash = async (s: string, hash: string) => {
	const arr = hash.split(":");
	if (arr.length === 2) {
		const [salt, key] = arr;
		const targetKey = await scrypt(s, salt, 8);
		return constantTimeEqual(targetKey, key);
	}
	if (arr.length !== 3) return false;
	const [version, salt, key] = arr;
	if (version === "s2") {
		const targetKey = await scrypt(s, salt);
		return constantTimeEqual(targetKey, key);
	}
	return false;
};

const constantTimeEqual = (a: string, b: string) => {
	if (a.length !== b.length) {
		return false;
	}
	const aUint8Array = new TextEncoder().encode(a);
	const bUint8Array = new TextEncoder().encode(b);

	let c = 0;
	for (let i = 0; i < a.length; i++) {
		c |= aUint8Array[i] ^ bUint8Array[i]; // ^: XOR operator
	}
	return c === 0;
};

const convertUint8ArrayToHex = (arr: Uint8Array) => {
	return [...arr].map((x) => x.toString(16).padStart(2, "0")).join("");
};
