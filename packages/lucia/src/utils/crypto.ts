import { LuciaError } from "../auth/error.js";
import { scrypt } from "hash-wasm";
import { generateRandomString } from "./nanoid.js";

export const generateScryptHash = async (s: string): Promise<string> => {
	const salt = generateRandomString(16);
	const key = await hashWithScrypt(s.normalize("NFKC"), salt);
	return `s2:${salt}:${key}`;
};

const hashWithScrypt = async (
	s: string,
	salt: string,
	blockSize = 16
): Promise<string> => {
	return await scrypt({
		password: new TextEncoder().encode(s),
		salt: new TextEncoder().encode(salt),
		costFactor: 16384,
		blockSize: blockSize,
		parallelism: 1,
		hashLength: 64,
		outputType: "hex"
	});
};

export const validateScryptHash = async (
	s: string,
	hash: string
): Promise<boolean> => {
	// detect bcrypt hash
	// lucia used bcrypt in one of the beta versions
	// TODO: remove in v3
	if (hash.startsWith("$2a")) {
		throw new LuciaError("AUTH_OUTDATED_PASSWORD");
	}
	const arr = hash.split(":");
	if (arr.length === 2) {
		const [salt, key] = arr;
		const targetKey = await hashWithScrypt(s.normalize("NFKC"), salt, 8);
		const result = constantTimeEqual(targetKey, key);
		return result;
	}
	if (arr.length !== 3) return false;
	const [version, salt, key] = arr;
	if (version === "s2") {
		const targetKey = await hashWithScrypt(s.normalize("NFKC"), salt);
		const result = constantTimeEqual(targetKey, key);
		return result;
	}
	return false;
};

const constantTimeEqual = (a: string, b: string): boolean => {
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

export const convertUint8ArrayToHex = (arr: Uint8Array): string => {
	return [...arr].map((x) => x.toString(16).padStart(2, "0")).join("");
};
