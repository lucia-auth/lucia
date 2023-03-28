import type { IncomingMessage, OutgoingMessage } from "node:http";
import type { Cookie, Middleware, RequestContext } from "../index.js";
import type {
	Request as ExpressRequest,
	Response as ExpressResponse
} from "express";

export const node = (): Middleware<[IncomingMessage, OutgoingMessage]> => {
	return (incomingMessage, outgoingMessage) => {
		const serverContext = {
			request: {
				url: incomingMessage.url ?? "",
				method: incomingMessage.method ?? "",
				headers: {
					origin: incomingMessage.headers.origin ?? null,
					cookie: incomingMessage.headers.cookie ?? null
				}
			},
			setCookie: (cookie) => {
				const setCookieHeaderValues =
					outgoingMessage
						.getHeader("Set-Cookie")
						?.toString()
						.split(",")
						.filter((val) => val) ?? [];
				outgoingMessage.setHeader("Set-Cookie", [
					cookie.serialize(),
					...setCookieHeaderValues
				]);
			}
		} as const satisfies RequestContext;
		return serverContext;
	};
};

export const express = (): Middleware<[ExpressRequest, ExpressResponse]> => {
	return (request, response) => {
		const serverContext = {
			request: {
				url: request.url,
				method: request.method,
				headers: {
					origin: request.headers.origin ?? null,
					cookie: request.headers.cookie ?? null
				}
			},
			setCookie: (cookie) => {
				response.cookie(cookie.name, cookie.value, cookie.attributes);
			}
		} as const satisfies RequestContext;
		return serverContext;
	};
};

type SvelteKitRequestEvent = {
	request: Request;
	cookies: {
		set: (name: string, value: string, options?: Cookie["attributes"]) => void;
	};
};

export const sveltekit = (): Middleware<[SvelteKitRequestEvent]> => {
	return (event) => {
		const serverContext = {
			request: {
				url: event.request.url,
				method: event.request.method,
				headers: {
					origin: event.request.headers.get("Origin") ?? null,
					cookie: event.request.headers.get("Cookie") ?? null
				}
			},
			setCookie: (cookie) => {
				event.cookies.set(cookie.name, cookie.value, cookie.attributes);
			}
		} as const satisfies RequestContext;
		return serverContext;
	};
};

type AstroAPIContext = {
	request: Request;
	cookies: {
		set: (name: string, value: string, options?: Cookie["attributes"]) => void;
	};
};

export const astro = (): Middleware<[AstroAPIContext]> => {
	return (context) => {
		const serverContext = {
			request: {
				url: context.request.url,
				method: context.request.method,
				headers: {
					origin: context.request.headers.get("Origin") ?? null,
					cookie: context.request.headers.get("Cookie") ?? null
				}
			},
			setCookie: (cookie) => {
				context.cookies.set(cookie.name, cookie.value, cookie.attributes);
			}
		} as const satisfies RequestContext;
		return serverContext;
	};
};
