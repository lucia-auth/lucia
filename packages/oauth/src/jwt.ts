import { encodeBase64 } from "./utils.js";

const encoder = new TextEncoder();

export const createES256SignedJWT = async (
	protectedHeader: {
		alg: "ES256";
		kid?: string;
	},
	payload: Record<any, any>,
	privateKey: string
) => {
	const cryptoKey = await crypto.subtle.importKey(
		"pkcs8",
		Uint8Array.from(atob(privateKey).split(""), (x) => x.charCodeAt(0)),
		{
			name: "ECDSA",
			namedCurve: "P-256"
		},
		true,
		["sign"]
	);
	const base64Header = encodeBase64(JSON.stringify(protectedHeader))
		.replaceAll("=", "")
		.replaceAll("+", "-")
		.replaceAll("/", "_");
	const base64Payload = encodeBase64(JSON.stringify(payload))
		.replaceAll("=", "")
		.replaceAll("+", "-")
		.replaceAll("/", "_");
	const signatureBody = [base64Header, base64Payload].join(".");
	const signatureBuffer = await crypto.subtle.sign(
		{
			name: "ECDSA",
			hash: "SHA-256"
		},
		cryptoKey,
		encoder.encode(signatureBody)
	);
	const signature = encodeBase64(
		String.fromCharCode(...new Uint8Array(signatureBuffer))
	)
		.replaceAll("=", "")
		.replaceAll("+", "-")
		.replaceAll("/", "_");
	const jwt = [signatureBody, signature].join(".");
	return jwt;
};
