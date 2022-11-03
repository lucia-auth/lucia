import type { Auth, MinimalRequest } from "lucia-auth";
import type { NextRequest } from "./types.js";

export const convertNextRequestToStandardRequest = (
	req: NextRequest,
	auth: Auth
): MinimalRequest => {
	const url = `${auth.configs.env === "DEV" ? "http" : "https"}://${req.headers.host}${req.url}`;
	return {
		headers: {
			get: (name: string) => {
				const value = req.headers[name.toLocaleLowerCase()] || null;
				if (Array.isArray(value)) return value.toString();
				return value;
			}
		},
		url,
		method: req.method || ""
	};
};