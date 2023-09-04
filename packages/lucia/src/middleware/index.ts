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
import type { FastifyReply, FastifyRequest } from "fastify";

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
		const [req, res] = args;

		const getUrl = () => {
			if (!req.headers.host) return "";
			const protocol = req.protocol;
			const host = req.headers.host;
			const pathname = req.path;
			return `${protocol}://${host}${pathname}`;
		};

		const requestContext = {
			request: {
				url: getUrl(),
				method: req.method,
				headers: {
					origin: req.headers.origin ?? null,
					cookie: req.headers.cookie ?? null,
					authorization: req.headers.authorization ?? null
				}
			},
			setCookie: (cookie) => {
				res.cookie(cookie.name, cookie.value, cookie.attributes);
			}
		} as const satisfies RequestContext;

		return requestContext;
	};
};

export const fastify = (): Middleware<[FastifyRequest, FastifyReply]> => {
	return ({ args }) => {
		const [req, res] = args;

		const getUrl = () => {
			if (!req.headers.host) return "";
			const protocol = req.protocol;
			const host = req.headers.host;
			const pathname = req.url;
			return `${protocol}://${host}${pathname}`;
		};

		const requestContext = {
			request: {
				url: getUrl(),
				method: req.method,
				headers: {
					origin: req.headers.origin ?? null,
					cookie: req.headers.cookie ?? null,
					authorization: req.headers.authorization ?? null
				}
			},
			setCookie: (cookie) => {
				res.header("Set-Cookie", [cookie.serialize()]);
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
	return ({ args, sessionCookieName }) => {
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
				storedSessionCookie: event.cookies.get(sessionCookieName) ?? null
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
		get: (name: string) =>
			| {
					value: string | undefined;
			  }
			| undefined;
	};
};

export const astro = (): Middleware<[AstroAPIContext]> => {
	return ({ args, sessionCookieName }) => {
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
				storedSessionCookie:
					context.cookies.get(sessionCookieName)?.value || null
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
	return ({ args, sessionCookieName }) => {
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
				storedSessionCookie: event.cookie.get(sessionCookieName)?.value ?? null
			},
			setCookie: (cookie) => {
				event.cookie.set(cookie.name, cookie.value, cookie.attributes);
			}
		} as const satisfies RequestContext;

		return requestContext;
	};
};

type ElysiaContext = {
	request: Request;
	set: {
		headers: Record<string, string> & {
			["Set-Cookie"]?: string | string[];
		};
		status?: number | undefined;
		redirect?: string | undefined;
	};
};

export const elysia = (): Middleware<[ElysiaContext]> => {
	return ({ args }) => {
		const [{ request, set }] = args;
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
			setCookie: (cookie: Cookie) => {
				const setCookieHeader = set.headers["Set-Cookie"] ?? [];
				const setCookieHeaders: string[] = Array.isArray(setCookieHeader)
					? setCookieHeader
					: [setCookieHeader];
				setCookieHeaders.push(cookie.serialize());
				set.headers["Set-Cookie"] = setCookieHeaders;
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

type NextCookie =
	| {
			name: string;
			value: string;
	  }
	| undefined;

type NextCookiesFunction = () => {
	set: (name: string, value: string, options: CookieAttributes) => void;
	get: (name: string) => NextCookie;
};

type NextRequest = Request & {
	cookies: {
		get: (name: string) => NextCookie;
	};
};

type NextJsAppServerContext = {
	cookies: NextCookiesFunction;
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
	return ({ args, sessionCookieName, env }) => {
		const [serverContext] = args;

		if ("request" in serverContext || "cookies" in serverContext) {
			const request =
				"request" in serverContext ? serverContext.request : serverContext;

			const readonlyCookieStore =
				typeof serverContext.cookies === "function"
					? serverContext.cookies()
					: serverContext.cookies;

			const sessionCookie =
				readonlyCookieStore.get(sessionCookieName)?.value ?? null;

			const requestContext = {
				request: {
					url: request?.url ?? "",
					method: request?.method ?? "GET",
					headers: {
						origin: request?.headers?.get("Origin") ?? null,
						cookie: null,
						authorization: request?.headers?.get("Authorization") ?? null
					},
					storedSessionCookie: sessionCookie
				},
				setCookie: (cookie) => {
					if (typeof serverContext.cookies !== "function") return;
					const cookieStore = serverContext.cookies();
					if (!cookieStore.set) return;
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

	return ({ args, sessionCookieName, env }) => {
		const [context] = args;
		return nodeMiddleware({
			args: [context.node.req, context.node.res],
			sessionCookieName,
			env
		});
	};
};

type HonoContext = {
	req: {
		url: string;
		method: string;
		headers: Headers;
	};
	header: (name: string, value: string) => void;
};

export const hono = (): Middleware<[HonoContext]> => {
	return ({ args }) => {
		const [context] = args;
		const requestContext = {
			request: {
				url: context.req.url,
				method: context.req.method,
				headers: {
					origin: context.req.headers.get("Origin"),
					cookie: context.req.headers.get("Cookie"),
					authorization: context.req.headers.get("Authorization")
				}
			},
			setCookie: (cookie: Cookie) => {
				context.header("Set-Cookie", cookie.serialize());
			}
		} as const satisfies RequestContext;

		return requestContext;
	};
};
