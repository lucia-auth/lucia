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
	const getHeadersValue = () => {
		if (type === "basic") {
			return ["Basic", token].join(" ");
		}
		if (type === "bearer") {
			return ["Bearer", token].join(" ");
		}
		throw new TypeError("Invalid token type");
	};
	return {
		Authorization: getHeadersValue()
	};
};
