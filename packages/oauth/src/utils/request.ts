import { OAuthRequestError } from "../core/request.js";

export const handleRequest = async <_ResponseBody extends {}>(
	request: Request
): Promise<_ResponseBody> => {
	request.headers.set("User-Agent", "lucia");
	request.headers.set("Accept", "application/json");
	const response = await fetch(request);
	if (!response.ok) {
		throw new OAuthRequestError(request, response);
	}
	return (await response.json()) as _ResponseBody;
};

export const createUrl = (
	url: string | URL,
	urlSearchParams: Record<string, string | undefined>
): URL => {
	const newUrl = new URL(url);
	for (const [key, value] of Object.entries(urlSearchParams)) {
		if (!value) continue;
		newUrl.searchParams.set(key, value);
	}
	return newUrl;
};

export const authorizationHeader = (
	type: "bearer" | "basic",
	token: string
): string => {
	if (type === "basic") {
		return ["Basic", token].join(" ");
	}
	if (type === "bearer") {
		return ["Bearer", token].join(" ");
	}
	throw new TypeError("Invalid token type");
};
