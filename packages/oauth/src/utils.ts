import { generateRandomString } from "lucia/utils";

export type AwaitedReturnType<T extends (...args: any[]) => any> = Awaited<
	ReturnType<T>
>;

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
