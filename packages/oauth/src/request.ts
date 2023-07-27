import { OAuthRequestError } from "./core.js";

export const handleRequest = async <T extends {}>(request: Request) => {
	request.headers.set("User-Agent", "lucia");
	request.headers.set("Accept", "application/json");
	const response = await fetch(request);
	if (!response.ok) {
		throw new OAuthRequestError(request, response);
	}
	return (await response.json()) as T;
};

export const createUrl = (
	base: string,
	urlSearchParams: Record<string, string> = {}
) => {
	const url = new URL(base);
	for (const [key, value] of Object.entries(urlSearchParams)) {
		url.searchParams.set(key, value);
	}
	return url;
};

export const authorizationHeader = (
	type: "bearer" | "basic",
	token: string
) => {
	if (type === "basic") {
		return ["Basic", token].join(" ");
	}
	if (type === "bearer") {
		return ["Bearer", token].join(" ");
	}
	throw new TypeError("Invalid token type");
};
