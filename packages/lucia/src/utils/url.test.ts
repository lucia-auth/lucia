import { test, expect } from "vitest";
import { isAllowedUrl } from "./url.js";

test("isAllowedUrl() returns expected result", async () => {
	expect(
		isAllowedUrl("http://example.com", {
			url: "http://example.com",
			allowedSubdomains: []
		})
	).toBe(true);
	expect(
		isAllowedUrl("http://foo.example.com", {
			url: "http://foo.example.com",
			allowedSubdomains: []
		})
	).toBe(true);
	expect(
		isAllowedUrl("http://not-allowed.com", {
			url: "http://example.com",
			allowedSubdomains: []
		})
	).toBe(false);
	expect(
		isAllowedUrl("http://localhost:3000", {
			url: "http://example.com",
			allowedSubdomains: []
		})
	).toBe(false);
	expect(
		isAllowedUrl("http://example.", {
			url: "http://example.com",
			allowedSubdomains: []
		})
	).toBe(false);

	expect(
		isAllowedUrl("http://example.com/foo", {
			url: "http://example.com/foo/bar",
			allowedSubdomains: "*"
		})
	).toBe(true);
	expect(
		isAllowedUrl("http://foo.example.com", {
			url: "http://example.com",
			allowedSubdomains: "*"
		})
	).toBe(true);
	expect(
		isAllowedUrl("http://foo.example.com", {
			url: "http://bar.example.com",
			allowedSubdomains: "*"
		})
	).toBe(true);
	expect(
		isAllowedUrl("http://foo.bar.example.com", {
			url: "http://example.com",
			allowedSubdomains: "*"
		})
	).toBe(true);
	expect(
		isAllowedUrl("http://foo.bar.example.com", {
			url: "http://foo.example.com",
			allowedSubdomains: "*"
		})
	).toBe(true);

	expect(
		isAllowedUrl("http://foo.example.com", {
			url: "http://example.com",
			allowedSubdomains: ["foo"]
		})
	).toBe(true);
	expect(
		isAllowedUrl("http://foo.example.com", {
			url: "http://example.com",
			allowedSubdomains: []
		})
	).toBe(false);
	expect(
		isAllowedUrl("http://foo.not-allowed.com", {
			url: "http://example.com",
			allowedSubdomains: ["foo"]
		})
	).toBe(false);

	expect(
		isAllowedUrl("http://foo.bar.example.com", {
			url: "http://example.com",
			allowedSubdomains: ["foo.bar"]
		})
	).toBe(true);
	expect(
		isAllowedUrl("http://foo.bar.example.com", {
			url: "http://example.com",
			allowedSubdomains: ["bar"]
		})
	).toBe(false);

	expect(
		isAllowedUrl("http://localhost:3000", {
			url: "http://localhost:3000",
			allowedSubdomains: []
		})
	).toBe(true);
	expect(
		isAllowedUrl("http://foo.localhost:3000", {
			url: "http://localhost:3000",
			allowedSubdomains: "*"
		})
	).toBe(true);
	expect(
		isAllowedUrl("http://foo.localhost:3000", {
			url: "http://localhost:3000",
			allowedSubdomains: ["foo"]
		})
	).toBe(true);
	expect(
		isAllowedUrl("http://bar.localhost:3000", {
			url: "http://localhost:3000",
			allowedSubdomains: ["foo"]
		})
	).toBe(false);

	expect(
		isAllowedUrl("http://example.", {
			url: "http://example.",
			allowedSubdomains: []
		})
	).toBe(true);
	expect(
		isAllowedUrl("http://foo.example.", {
			url: "http://example.",
			allowedSubdomains: "*"
		})
	).toBe(true);
	expect(
		isAllowedUrl("http://foo.example.", {
			url: "http://example.",
			allowedSubdomains: ["foo"]
		})
	).toBe(true);
	expect(
		isAllowedUrl("http://bar.example.", {
			url: "http://example.",
			allowedSubdomains: ["foo"]
		})
	).toBe(false);

	expect(
		isAllowedUrl("http://example.com.com", {
			url: "http://example.com",
			allowedSubdomains: []
		})
	).toBe(false);
	expect(
		isAllowedUrl("http://example.com.com", {
			url: "http://example.com",
			allowedSubdomains: "*"
		})
	).toBe(false);
	expect(
		isAllowedUrl("http://localhost.com", {
			url: "http://localhost:3000",
			allowedSubdomains: "*"
		})
	).toBe(false);
});
