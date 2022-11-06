import { LuciaOAuthError } from "./index.js";

interface FetchOptions {
	body?: Record<any, any>;
	bearerToken?: string;
	acceptJSON?: true;
}

export const post = async (url: string, options?: FetchOptions) => {
	return sendRequest(url, "POST", options);
};

export const get = async (url: string, options?: FetchOptions) => {
	return sendRequest(url, "GET", options);
};

export const sendRequest = async (url: string, method: "GET" | "POST", options?: FetchOptions) => {
	const response = await fetch(url, {
		...(options?.body && { body: JSON.stringify(options.body) }),
		headers: {
			Accept: "application/json",
			...(options?.body && {
				"Content-Type": "application/json"
			}),
			...(options?.bearerToken && {
				Authorization: `Bearer ${options.bearerToken}`
			})
		},
		method
	});
	if (!response.ok) throw new LuciaOAuthError("REQUEST_FAILED");
	return await response.json();
};
