import { test, expect } from "vitest";
import { generateScryptHash, verifyScryptHash } from "./crypto.js";
import { encodeHex } from "oslo/encoding";

test("validateScryptHash() validates hashes generated with generateScryptHash()", async () => {
	const password = encodeHex(crypto.getRandomValues(new Uint8Array(32)));
	const hash = await generateScryptHash(password);
	await expect(verifyScryptHash(password, hash)).resolves.toBe(true);
	const falsePassword = encodeHex(crypto.getRandomValues(new Uint8Array(32)));
	await expect(verifyScryptHash(falsePassword, hash)).resolves.toBe(false);
});
