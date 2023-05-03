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

	// standard API
	// IGNORE WARNING
	return btoa(s);
};
