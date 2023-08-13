import { generateRandomString } from "lucia/utils";

const isDeno = () => {
	return typeof window !== "undefined" && "Deno" in window;
};

export const encodeBase64 = (
	data: string | ArrayLike<number> | ArrayBufferLike
) => {
	// ORDER IMPORTANT
	// buffer API exists in deno

	// ignore deprecation for `btoa()`
	if (isDeno()) {
		// deno
		if (typeof data === "string") return btoa(data);
		return btoa(String.fromCharCode(...new Uint8Array(data)));
	}
	if (typeof Buffer === "function") {
		// node or bun
		const bufferData = typeof data === "string" ? data : new Uint8Array(data);
		return Buffer.from(bufferData).toString("base64");
	}
	if (typeof data === "string") return btoa(data);
	return btoa(String.fromCharCode(...new Uint8Array(data)));
};

export const encodeBase64Url = (
	data: string | ArrayLike<number> | ArrayBufferLike
) => {
	return encodeBase64(data)
		.replaceAll("=", "")
		.replaceAll("+", "-")
		.replaceAll("/", "_");
};

export const decodeBase64 = (data: string) => {
	// ORDER IMPORTANT
	// buffer API exists in deno

	// ignore deprecation for `btoa()`
	if (isDeno()) {
		// deno
		return Uint8Array.from(atob(data).split(""), (x) => x.charCodeAt(0));
	}
	if (typeof Buffer === "function") {
		// node or bun
		return new Uint8Array(Buffer.from(data, "base64"));
	}
	return Uint8Array.from(atob(data).split(""), (x) => x.charCodeAt(0));
};

export const decodeBase64Url = (data: string) => {
	return decodeBase64(data.replaceAll("-", "+").replaceAll("_", "/"));
};

export const generateState = () => {
	return generateRandomString(43);
};

export const scope = (base: string[], config: string[] = []) => {
	return [...base, ...(config ?? [])].join(" ");
};
export const getPKCS8Key = (pkcs8: string) => {
	return [
		"\n",
		pkcs8
			.replace(/-----BEGIN PRIVATE KEY-----/, "")
			.replace(/-----END PRIVATE KEY-----/, ""),
		"\n"
	].join("");
};

// Generates code_challenge from code_verifier, as specified in RFC 7636.
export const generatePKCECodeChallenge = async (
	method: "S256",
	verifier: string
) => {
	if (method === "S256") {
		const verifierBuffer = new TextEncoder().encode(verifier);
		const challengeBuffer = await crypto.subtle.digest(
			"SHA-256",
			verifierBuffer
		);
		return encodeBase64Url(challengeBuffer);
	}
	throw new TypeError("Invalid PKCE code challenge method");
};
