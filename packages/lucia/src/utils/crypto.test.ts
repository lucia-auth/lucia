import { test, expect } from "vitest";
import {
	convertUint8ArrayToHex,
	generateScryptHash,
	validateScryptHash,
	generateRandomString
} from "./crypto.js";

test("convertUint8ArrayToHex() output matches Buffer.toString()", async () => {
	const testUint8Array = crypto.getRandomValues(new Uint8Array(16));
	const output = convertUint8ArrayToHex(testUint8Array);
	const nodeOutput = Buffer.from(testUint8Array).toString("hex");
	expect(output).toBe(nodeOutput);
});

test("validateScryptHash() validates hashes generated with generateScryptHash()", async () => {
	const password = generateRandomString(16);
	const hash = await generateScryptHash(password);
	expect(await validateScryptHash(password, hash)).toBeTruthy();
	const falsePassword = generateRandomString(16);
	expect(await validateScryptHash(falsePassword, hash)).toBeFalsy();
});
