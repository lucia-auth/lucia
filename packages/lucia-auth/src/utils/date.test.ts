import { test, expect } from "vitest";
import { isWithinExpiration } from "./date.js";

test("isWithinExpiration()", async () => {
	const futureTime = new Date().getTime() + 10 * 1000;
	expect(isWithinExpiration(futureTime)).toBeTruthy();
	const pastTime = new Date().getTime() - 10 * 1000;
	expect(isWithinExpiration(pastTime)).toBeFalsy();
});
