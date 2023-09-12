import { test, expect } from "vitest";
import { isAllowedOrigin } from "./url.js";

test("isAllowedOrigin() returns expected result", async () => {
	expect(isAllowedOrigin("http://example.com", "example.com", [])).toBe(true);
	expect(isAllowedOrigin("http://foo.example.com", "foo.example.com", [])).toBe(
		true
	);
	expect(isAllowedOrigin("http://not-allowed.com", "example.com", [])).toBe(
		false
	);
	expect(isAllowedOrigin("http://localhost:3000", "example.com", [])).toBe(
		false
	);
	expect(isAllowedOrigin("http://example.", "example.com", [])).toBe(false);

	expect(isAllowedOrigin("http://example.com/foo", "example.com", "*")).toBe(
		true
	);
	expect(isAllowedOrigin("http://foo.example.com", "example.com", "*")).toBe(
		true
	);
	expect(
		isAllowedOrigin("http://foo.example.com", "bar.example.com", "*")
	).toBe(true);
	expect(
		isAllowedOrigin("http://foo.bar.example.com", "example.com", "*")
	).toBe(true);
	expect(
		isAllowedOrigin("http://foo.bar.example.com", "foo.example.com", "*")
	).toBe(true);

	expect(
		isAllowedOrigin("http://foo.example.com", "example.com", ["foo"])
	).toBe(true);
	expect(isAllowedOrigin("http://foo.example.com", "example.com", [])).toBe(
		false
	);
	expect(
		isAllowedOrigin("http://foo.not-allowed.com", "example.com", ["foo"])
	).toBe(false);

	expect(
		isAllowedOrigin("http://foo.bar.example.com", "example.com", ["foo.bar"])
	).toBe(true);
	expect(
		isAllowedOrigin("http://foo.bar.example.com", "example.com", ["bar"])
	).toBe(false);
	expect(isAllowedOrigin("http://example.com/foo", "example.com", [null])).toBe(
		true
	);

	expect(isAllowedOrigin("http://localhost:3000", "localhost:3000", [])).toBe(
		true
	);
	expect(
		isAllowedOrigin("http://foo.localhost:3000", "localhost:3000", "*")
	).toBe(true);
	expect(
		isAllowedOrigin("http://foo.localhost:3000", "localhost:3000", ["foo"])
	).toBe(true);
	expect(
		isAllowedOrigin("http://bar.localhost:3000", "localhost:3000", ["foo"])
	).toBe(false);

	expect(isAllowedOrigin("http://example.", "example.", [])).toBe(true);
	expect(isAllowedOrigin("http://foo.example.", "example.", "*")).toBe(true);
	expect(isAllowedOrigin("http://foo.example.", "example.", ["foo"])).toBe(
		true
	);
	expect(isAllowedOrigin("http://bar.example.", "example.", ["foo"])).toBe(
		false
	);

	expect(isAllowedOrigin("http://example.com.com", "example.com", [])).toBe(
		false
	);
	expect(isAllowedOrigin("http://example.com.com", "example.com", "*")).toBe(
		false
	);
	expect(isAllowedOrigin("http://localhost.com", "localhost:3000", "*")).toBe(
		false
	);

	expect(
		isAllowedOrigin("http://foo.example.com", "example.com", ["foo", "bar"])
	).toBe(true);
	expect(
		isAllowedOrigin("http://example.com", "example.com", [null, "bar"])
	).toBe(true);
});
