import { decodeBase64Url } from "../utils/encode.js";

const decoder = new TextDecoder();

// does not verify id tokens
export const decodeIdToken = <_Claims extends {}>(
	idToken: string
): {
	iss: string;
	aud: string;
	exp: number;
} & _Claims => {
	const idTokenParts = idToken.split(".");
	if (idTokenParts.length !== 3) throw new SyntaxError("Invalid ID Token");
	const base64UrlPayload = idTokenParts[1];
	const payload: unknown = JSON.parse(
		decoder.decode(decodeBase64Url(base64UrlPayload))
	);
	if (!payload || typeof payload !== "object") {
		throw new SyntaxError("Invalid ID Token");
	}
	return payload as {
		iss: string;
		aud: string;
		exp: number;
	} & _Claims;
};
