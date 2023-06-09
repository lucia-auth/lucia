import type {
	IncomingMessage,
	OutgoingMessage,
	ServerResponse
} from "node:http";
import {
	SESSION_COOKIE_NAME,
	type Cookie,
	type Middleware,
	type RequestContext
} from "../index.js";
import type {
	Request as ExpressRequest,
	Response as ExpressResponse
} from "express";
import { CookieAttributes } from "../utils/cookie.js";
import { LuciaRequest } from "../auth/request.js";

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
		set: (name: string, value: string, options?: CookieAttributes) => void;
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
		set: (name: string, value: string, options?: CookieAttributes) => void;
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
		set: (name: string, value: string, options?: CookieAttributes) => void;
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

type NextJsAppServerContext = {
	cookies: () => {
		set?: (name: string, value: string, options?: CookieAttributes) => void;
		get: (name: string) =>
			| {
					name: string;
					value: string;
			  }
			| undefined;
	};
	request?: Request;
};

type NextJsPagesServerContext =
	| {
			req: IncomingMessage;
			res?: OutgoingMessage;
	  }
	| {
			req: IncomingMessage;
			headers: Headers;
	  }
	| {
			req: IncomingMessage;
			response: Response;
	  };

type NextRequest = Request & {
	cookies: {
		set: (name: string, value: string) => void;
		get: (name: string) =>
			| {
					name: string;
					value: string;
			  }
			| undefined;
	};
};

export const nextjs = (): Middleware<
	[NextJsPagesServerContext | NextJsAppServerContext | { request: NextRequest }]
> => {
	return (serverContext, env) => {
		if ("cookies" in serverContext) {
			const cookieStore = serverContext.cookies();
			const sessionCookie = cookieStore.get(SESSION_COOKIE_NAME) ?? null;
			const requestContext = {
				request: {
					url: serverContext.request?.url ?? "",
					method: serverContext.request?.method ?? "GET",
					headers: {
						origin: serverContext.request?.headers.get("Origin") ?? null,
						cookie: sessionCookie
							? `${SESSION_COOKIE_NAME}=${sessionCookie.value}`
							: null
					}
				},
				setCookie: (cookie) => {
					try {
						if (!cookieStore.set) return;
						cookieStore.set(cookie.name, cookie.value, cookie.attributes);
					} catch {
						// ignore - set() is not available
					}
				}
			} as const satisfies RequestContext;
			return requestContext;
		}
		if ("request" in serverContext) {
			const sessionCookie =
				serverContext.request.cookies.get(SESSION_COOKIE_NAME) ?? null;
			const requestContext = {
				request: {
					url: serverContext.request.url,
					method: serverContext.request.method,
					headers: {
						origin: serverContext.request.headers.get("Origin") ?? null,
						cookie: sessionCookie
							? `${SESSION_COOKIE_NAME}=${sessionCookie.value}`
							: null
					}
				},
				setCookie: () => {
					// ...
				}
			} as const satisfies RequestContext;
			return requestContext;
		}
		const getUrl = () => {
			if (!serverContext.req.headers.host) return "";
			const protocol = env === "DEV" ? "http:" : "https:";
			const host = serverContext.req.headers.host;
			const pathname = serverContext.req.url ?? "";
			return `${protocol}//${host}${pathname}`;
		};
		const request = {
			url: getUrl(),
			method: serverContext.req.method ?? "",
			headers: {
				origin: serverContext.req.headers.origin ?? null,
				cookie: serverContext.req.headers.cookie ?? null
			}
		} satisfies LuciaRequest;
		const createSetCookie = () => {
			if ("headers" in serverContext) {
				return (cookie: Cookie) => {
					serverContext.headers.append("Set-Cookie", cookie.serialize());
				};
			}
			if ("response" in serverContext) {
				return (cookie: Cookie) => {
					serverContext.response.headers.append(
						"Set-Cookie",
						cookie.serialize()
					);
				};
			}
			return (cookie: Cookie) => {
				if (!serverContext.res) return;
				const setCookieHeaderValues =
					serverContext.res
						.getHeader("Set-Cookie")
						?.toString()
						.split(",")
						.filter((val) => val) ?? [];
				serverContext.res.setHeader("Set-Cookie", [
					cookie.serialize(),
					...setCookieHeaderValues
				]);
			};
		};
		const requestContext = {
			request,
			setCookie: createSetCookie()
		} as const satisfies RequestContext;
		return requestContext;
	};
};

type H3Event = {
	node: {
		req: IncomingMessage;
		res: ServerResponse;
	};
};

export const h3 = (): Middleware<[H3Event]> => {
	const nodeMiddleware = node();
	return (context, env) => {
		return nodeMiddleware(context.node.req, context.node.res, env);
	};
};
