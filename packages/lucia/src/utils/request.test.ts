import { test, expect } from "vitest";
import { createHeadersFromObject } from "./request.js";

test("createHeadersFromObject() returns Headers with expected items", async () => {
	expect(
		Array.from(
			createHeadersFromObject({
				a: "foo",
				b: undefined,
				c: null,
				d: ["bar", "baz"]
			}).entries()
		)
	).toStrictEqual([
		["a", "foo"],
		["d", "bar, baz"]
	]);
});
