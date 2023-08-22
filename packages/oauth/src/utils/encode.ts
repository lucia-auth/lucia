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