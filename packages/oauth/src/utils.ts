import { generateRandomString } from "lucia/utils";

export const encodeBase64 = (s: string) => {
	// ORDER IS IMPORTANT!!
	// Buffer API EXISTS IN DENO!!
	if (typeof window !== "undefined" && "Deno" in window) {
		// deno
		return btoa(s);
	}
	if (typeof Buffer === "function") {
		// node
		return Buffer.from(s).toString("base64");
	}

	// standard API
	// IGNORE WARNING
	return btoa(s);
};

export const generateState = () => {
	return generateRandomString(43);
};

export const scope = (base: string[], config: string[] = []) => {
	return [...base, ...(config ?? [])].join(" ");
};

export const encodeBase64Url = (arg: string) => {
	return encodeBase64(arg)
		.split("=")[0]
		.replace(/\+/g, "-")
		.replace(/\//g, "_");
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
		const challengeArray = Array.from(new Uint8Array(challengeBuffer));
		return String.fromCharCode(...challengeArray);
	}
	throw new TypeError("Invalid PKCE code challenge method");
};
