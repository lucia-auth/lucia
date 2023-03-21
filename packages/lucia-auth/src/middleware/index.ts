import type { Middleware } from "../index.js";

export const standard = (): Middleware<Request, Response> => {
	return {
		transformRequest: (request) => {
			return {
				url: request.url,
				method: request.method,
				headers: {
					origin: request.headers.get("Origin") ?? null,
					cookie: request.headers.get("Cookie") ?? null
				}
			};
		},
		appendResponseHeader: (response, name, value) => {
			response.headers.append(name, value);
		}
	};
};