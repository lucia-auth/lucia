import { generateRandomString } from "lucia/utils";

export type AwaitedReturnType<T extends (...args: any[]) => any> = Awaited<
	ReturnType<T>
>;

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

	// standard API - ignore warning
	return btoa(s);
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
