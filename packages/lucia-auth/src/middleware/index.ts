import type { IncomingMessage, OutgoingMessage } from "node:http";
import type { Cookie, Middleware, RequestContext } from "../index.js";
import type {
	Request as ExpressRequest,
	Response as ExpressResponse
} from "express";

export const node = (): Middleware<[IncomingMessage, OutgoingMessage]> => {
	return (incomingMessage, outgoingMessage, env) => {
		const getUrl = () => {
			if (!incomingMessage.headers.host) return "";
			const protocol = env === "DEV" ? "http:" : "https:";
			const host = incomingMessage.headers.host;
			const pathname = incomingMessage.url ?? "";
			return `${protocol}//${host}${pathname}`;
		};
		const requestContext = {
			request: {
				url: getUrl(),
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
		return requestContext;
	};
};

export const express = (): Middleware<[ExpressRequest, ExpressResponse]> => {
	return (request, response) => {
		const requestContext = {
			request: {
				url: `${request.protocol}://${request.hostname}${request.path}`,
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
		return requestContext;
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
		const requestContext = {
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
		return requestContext;
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
		const requestContext = {
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
		return requestContext;
	};
};

type QwikRequestEvent = {
	request: Request;
	cookie: {
		set: (name: string, value: string, options?: Cookie["attributes"]) => void;
	};
};

export const qwik = (): Middleware<[QwikRequestEvent]> => {
	return (c) => {
		const requestContext = {
			request: {
				url: c.request.url.toString(),
				method: c.request.method,
				headers: {
					origin: c.request.headers.get("Origin") ?? null,
					cookie: c.request.headers.get("Cookie") ?? null
				}
			},
			setCookie: (cookie) => {
				c.cookie.set(cookie.name, cookie.value, cookie.attributes);
			}
		} as const satisfies RequestContext;

		return requestContext;
	};
};

export const lucia = (): Middleware<[RequestContext]> => {
	return (requestContext) => requestContext;
};

export const web = (): Middleware<[Request, Headers | Response]> => {
	return (request, arg2) => {
		const createSetCookie = () => {
			if (arg2 instanceof Response) {
				return (cookie: Cookie) => {
					arg2.headers.append("Set-Cookie", cookie.serialize());
				};
			}
			return (cookie: Cookie) => {
				arg2.append("Set-Cookie", cookie.serialize());
			};
		};
		const requestContext = {
			request: {
				url: request.url,
				method: request.method,
				headers: {
					origin: request.headers.get("Origin") ?? null,
					cookie: request.headers.get("Cookie") ?? null
				}
			},
			setCookie: createSetCookie()
		} as const satisfies RequestContext;
		return requestContext;
	};
};

export const nextjs = (): Middleware<
	[IncomingMessage | Request, OutgoingMessage | Response | Headers]
> => {
	return (arg1, arg2, env) => {
		const getLuciaRequest = () => {
			if (arg1 instanceof Request) {
				return {
					url: arg1.url,
					method: arg1.method,
					headers: {
						origin: arg1.headers.get("Origin") ?? null,
						cookie: arg1.headers.get("Cookie") ?? null
					}
				};
			}
			const getUrl = () => {
				if (!arg1.headers.host) return "";
				const protocol = env === "DEV" ? "http:" : "https:";
				const host = arg1.headers.host;
				const pathname = arg1.url ?? "";
				return `${protocol}//${host}${pathname}`;
			};
			return {
				url: getUrl(),
				method: arg1.method ?? "",
				headers: {
					origin: arg1.headers.origin ?? null,
					cookie: arg1.headers.cookie ?? null
				}
			};
		};
		const createSetCookie = () => {
			if (arg2 instanceof Response) {
				return (cookie: Cookie) => {
					arg2.headers.append("Set-Cookie", cookie.serialize());
				};
			}
			if (arg2 instanceof Headers) {
				return (cookie: Cookie) => {
					arg2.append("Set-Cookie", cookie.serialize());
				};
			}
			return (cookie: Cookie) => {
				const setCookieHeaderValues =
					arg2
						.getHeader("Set-Cookie")
						?.toString()
						.split(",")
						.filter((val) => val) ?? [];
				arg2.setHeader("Set-Cookie", [
					cookie.serialize(),
					...setCookieHeaderValues
				]);
			};
		};
		const requestContext = {
			request: getLuciaRequest(),
			setCookie: createSetCookie()
		} as const satisfies RequestContext;
		return requestContext;
	};
};