import { test, expect } from "vitest";
import { generateScryptHash, validateScryptHash } from "./crypto.js";
import { encodeHex } from "oslo/encoding";

test("validateScryptHash() validates hashes generated with generateScryptHash()", async () => {
	const password = encodeHex(crypto.getRandomValues(new Uint8Array(32)));
	const hash = await generateScryptHash(password);
	expect(await validateScryptHash(password, hash)).toBeTruthy();
	const falsePassword = encodeHex(crypto.getRandomValues(new Uint8Array(32)));
	expect(await validateScryptHash(falsePassword, hash)).toBeFalsy();
});
