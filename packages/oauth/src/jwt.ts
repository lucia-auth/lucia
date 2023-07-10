import { decodeBase64, decodeBase64Url, encodeBase64Url } from "./utils.js";

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
		decodeBase64(privateKey),
		{
			name: "ECDSA",
			namedCurve: "P-256"
		},
		true,
		["sign"]
	);
	const base64UrlHeader = encodeBase64Url(JSON.stringify(protectedHeader));
	const base64UrlPayload = encodeBase64Url(JSON.stringify(payload));
	const signatureBody = [base64UrlHeader, base64UrlPayload].join(".");
	const signatureBuffer = await crypto.subtle.sign(
		{
			name: "ECDSA",
			hash: "SHA-256"
		},
		cryptoKey,
		encoder.encode(signatureBody)
	);
	const signature = encodeBase64Url(signatureBuffer);
	const jwt = [signatureBody, signature].join(".");
	return jwt;
};

export class IdTokenError extends Error {
	public message: "ID_TOKEN_INVALID_JWT" | "ID_TOKEN_INVALID_CLAIM";
	constructor(message: IdTokenError["message"]) {
		super(message);
		this.message = message;
	}
}

const decoder = new TextDecoder();

// does not check for JWT signature
export const decodeJWT = <_Claims extends {}>(
	idToken: string,
) => {
	const idTokenParts = idToken.split(".");
	if (idTokenParts.length !== 3) throw new Error("Invalid id token");
	const base64UrlPayload = idTokenParts[1];
	const payload = JSON.parse(
		decoder.decode(decodeBase64Url(base64UrlPayload))
	) as {
		iss: string;
		aud: string;
		exp: number;
	} & _Claims;
	return payload;
};
