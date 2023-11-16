import { test, expect } from "vitest";
import { Scrypt } from "./crypto.js";
import { encodeHex } from "oslo/encoding";

test("validateScryptHash() validates hashes generated with generateScryptHash()", async () => {
	const password = encodeHex(crypto.getRandomValues(new Uint8Array(32)));
	const scrypt = new Scrypt();
	const hash = await scrypt.hash(password);
	await expect(scrypt.verify(hash, password)).resolves.toBe(true);
	const falsePassword = encodeHex(crypto.getRandomValues(new Uint8Array(32)));
	await expect(scrypt.verify(hash, falsePassword)).resolves.toBe(false);
});
