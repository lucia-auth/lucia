import { LuciaOAuthRequestError } from "./core.js";

export const handleRequest = async <T extends {}>(request: Request) => {
	request.headers.set("User-Agent", "lucia");
	request.headers.set("Accept", "application/json");
	const response = await fetch(request);
	if (!response.ok) {
		const getErrorBody = async () => {
			try {
				return await response.json();
			} catch {
				return null;
			}
		};
		const errorBody = getErrorBody();
		throw new LuciaOAuthRequestError(response.status, errorBody);
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

export const authorizationHeaders = (
	type: "bearer" | "basic",
	token: string
) => {
	if (type === "basic") {
		return {
			Authorization: "Basic " + token
		};
	}
	if (type === "bearer") {
		return {
			Authorization: "Bearer " + token
		};
	}

	throw new TypeError("Invalid token type");
};
