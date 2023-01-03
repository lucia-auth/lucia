import { LuciaOAuthError } from "./index.js";

interface FetchOptions {
	env: "DEV" | "PROD";
	body?: Record<any, any>;
	bearerToken?: string;
	basicToken?: string;
	acceptJSON?: true;
	clientId?: string;
}

export const post = async (url: string, options: FetchOptions) => {
	return sendRequest(url, "POST", options);
};

export const get = async (url: string, options: FetchOptions) => {
	return sendRequest(url, "GET", options);
};

export const sendRequest = async (url: string, method: "GET" | "POST", options: FetchOptions) => {
	const response = await fetch(url, {
		...(options?.body && { body: JSON.stringify(options.body) }),
		headers: {
			"User-Agent": "lucia",
			Accept: "application/json",
			...(options?.body && {
				"Content-Type": "application/json"
			}),
			...(options?.clientId && {
				"Client-ID": options.clientId
			}),
			...(options?.bearerToken && {
				Authorization: `Bearer ${options.bearerToken}`
			}),
			...(options?.basicToken && {
				Authorization: `Basic ${options.basicToken}`
			})
		},
		method
	});
	if (!response.ok) {
		if (options.env === "DEV") {
			try {
				console.log(response.status, await response.json());
			} catch {
				console.log(response.status);
			}
		}
		throw new LuciaOAuthError("REQUEST_FAILED");
	}
	return await response.json();
};
