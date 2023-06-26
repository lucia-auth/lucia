import type { CookieAttributes } from "../utils/cookie.js";
import type { LuciaRequest } from "../auth/request.js";
import type { Cookie, Env, Middleware, RequestContext } from "../index.js";

import type {
	IncomingMessage,
	OutgoingMessage,
	ServerResponse
} from "node:http";
import type {
	Request as ExpressRequest,
	Response as ExpressResponse
} from "express";

const getIncomingMessageUrl = (incomingMessage: IncomingMessage, env: Env) => {
	if (!incomingMessage.headers.host) return "";
	const protocol = env === "DEV" ? "http:" : "https:";
	const host = incomingMessage.headers.host;
	const pathname = incomingMessage.url ?? "";
	return `${protocol}//${host}${pathname}`;
};

export const node = (): Middleware<[IncomingMessage, OutgoingMessage]> => {
	return ({ args, env }) => {
		const [incomingMessage, outgoingMessage] = args;

		const requestContext = {
			request: {
				url: getIncomingMessageUrl(incomingMessage, env),
				method: incomingMessage.method ?? "",
				headers: {
					origin: incomingMessage.headers.origin ?? null,
					cookie: incomingMessage.headers.cookie ?? null,
					authorization: incomingMessage.headers.authorization ?? null
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
	return ({ args }) => {
		const [request, response] = args;

		const requestContext = {
			request: {
				url: `${request.protocol}://${request.hostname}${request.path}`,
				method: request.method,
				headers: {
					origin: request.headers.origin ?? null,
					cookie: request.headers.cookie ?? null,
					authorization: request.headers.authorization ?? null
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
		get: (name: string) => string | undefined;
	};
};

export const sveltekit = (): Middleware<[SvelteKitRequestEvent]> => {
	return ({ args, cookieName }) => {
		const [event] = args;

		const requestContext = {
			request: {
				url: event.request.url,
				method: event.request.method,
				headers: {
					origin: event.request.headers.get("Origin"),
					cookie: event.request.headers.get("Cookie"),
					authorization: event.request.headers.get("Authorization")
				},
				storedSessionCookie: event.cookies.get(cookieName) ?? null
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
		get: (name: string) => {
			value: string | undefined;
		};
	};
};

export const astro = (): Middleware<[AstroAPIContext]> => {
	return ({ args, cookieName }) => {
		const [context] = args;

		const requestContext = {
			request: {
				url: context.request.url,
				method: context.request.method,
				headers: {
					origin: context.request.headers.get("Origin"),
					cookie: context.request.headers.get("Cookie"),
					authorization: context.request.headers.get("Authorization")
				},
				storedSessionCookie: context.cookies.get(cookieName).value || null
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
		get: (key: string) => {
			value: string;
		} | null;
	};
};

export const qwik = (): Middleware<[QwikRequestEvent]> => {
	return ({ args, cookieName }) => {
		const [event] = args;

		const requestContext = {
			request: {
				url: event.request.url.toString(),
				method: event.request.method,
				headers: {
					origin: event.request.headers.get("Origin"),
					cookie: event.request.headers.get("Cookie"),
					authorization: event.request.headers.get("Authorization")
				},
				storedSessionCookie: event.cookie.get(cookieName)?.value ?? null
			},
			setCookie: (cookie) => {
				event.cookie.set(cookie.name, cookie.value, cookie.attributes);
			}
		} as const satisfies RequestContext;

		return requestContext;
	};
};

export const lucia = (): Middleware<[RequestContext]> => {
	return ({ args }) => args[0];
};

export const web = (): Middleware<[Request]> => {
	return ({ args }) => {
		const [request] = args;

		const requestContext = {
			request: {
				url: request.url,
				method: request.method,
				headers: {
					origin: request.headers.get("Origin"),
					cookie: request.headers.get("Cookie"),
					authorization: request.headers.get("Authorization")
				}
			},
			setCookie: () => {
				throw new Error(
					"Cookies cannot be set when using the `web()` middleware"
				);
			}
		} as const satisfies RequestContext;

		return requestContext;
	};
};

type NextJsPagesServerContext = {
	req: IncomingMessage;
	res: OutgoingMessage;
};

type NextJsCookie =
	| {
			name: string;
			value: string;
	  }
	| undefined;

type NextRequest = Request & {
	cookies: {
		get: (name: string) => NextJsCookie;
	};
};

type NextJsAppServerContext = {
	cookies: () => {
		set?: (name: string, value: string, options?: CookieAttributes) => void;
		get: (name: string) => NextJsCookie;
	};
	request: NextRequest | null;
};

export const nextjs = (): Middleware<
	[
		| NextJsPagesServerContext
		| NextJsAppServerContext
		| NextRequest
		| IncomingMessage
	]
> => {
	return ({ args, cookieName, env }) => {
		const [serverContext] = args;
		if ("request" in serverContext || "cookies" in serverContext) {
			const request =
				"request" in serverContext ? serverContext.request : serverContext;

			const cookieStore:
				| NextRequest["cookies"]
				| ReturnType<NextJsAppServerContext["cookies"]> =
				"request" in serverContext
					? serverContext.cookies()
					: serverContext.cookies;

			const sessionCookie = cookieStore.get(cookieName)?.value ?? null;

			const requestContext = {
				request: {
					url: request?.url ?? "",
					method: request?.method ?? "GET",
					headers: {
						origin: request?.headers.get("Origin") ?? null,
						cookie: null,
						authorization: request?.headers.get("Authorization") ?? null
					},
					storedSessionCookie: sessionCookie
				},
				setCookie: (cookie) => {
					if (!("set" in cookieStore) || !cookieStore.set) return;
					try {
						cookieStore.set(cookie.name, cookie.value, cookie.attributes);
					} catch {
						// ignore - set() is not available
					}
				}
			} as const satisfies RequestContext;

			return requestContext;
		}

		const req = "req" in serverContext ? serverContext.req : serverContext;
		const res = "res" in serverContext ? serverContext.res : null;

		const request = {
			url: getIncomingMessageUrl(req, env),
			method: req.method ?? "",
			headers: {
				origin: req.headers.origin ?? null,
				cookie: req.headers.cookie ?? null,
				authorization: req.headers.authorization ?? null
			}
		} satisfies LuciaRequest;

		const requestContext = {
			request,
			setCookie: (cookie: Cookie) => {
				if (!res) return;
				const setCookieHeaderValues =
					res
						.getHeader("Set-Cookie")
						?.toString()
						.split(",")
						.filter((val) => val) ?? [];
				res.setHeader("Set-Cookie", [
					cookie.serialize(),
					...setCookieHeaderValues
				]);
			}
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

	return ({ args, cookieName, env }) => {
		const [context] = args;
		return nodeMiddleware({
			args: [context.node.req, context.node.res],
			cookieName,
			env
		});
	};
};
