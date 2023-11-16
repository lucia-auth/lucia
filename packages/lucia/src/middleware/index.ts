import { createHeadersFromObject } from "../utils/request.js";

import type { CookieAttributes } from "../utils/cookie.js";
import type {
	LuciaRequest,
	Middleware,
	RequestContext
} from "../auth/request.js";

type NodeIncomingMessage = {
	method?: string;
	headers: Record<string, string | string[] | undefined>;
};

type NodeOutGoingMessage = {
	getHeader: (name: string) => string | string[] | number | undefined;
	setHeader: (name: string, value: string | number | readonly string[]) => void;
};

export const node = (): Middleware<
	[NodeIncomingMessage, NodeOutGoingMessage]
> => {
	return ({ args }) => {
		const [incomingMessage, outgoingMessage] = args;
		const requestContext = {
			request: {
				method: incomingMessage.method ?? "",
				headers: createHeadersFromObject(incomingMessage.headers)
			},
			setCookie: (cookie) => {
				let parsedSetCookieHeaderValues: string[] = [];
				const setCookieHeaderValue = outgoingMessage.getHeader("Set-Cookie");
				if (typeof setCookieHeaderValue === "string") {
					parsedSetCookieHeaderValues = [setCookieHeaderValue];
				} else if (Array.isArray(setCookieHeaderValue)) {
					parsedSetCookieHeaderValues = setCookieHeaderValue;
				}
				outgoingMessage.setHeader("Set-Cookie", [
					cookie.serialize(),
					...parsedSetCookieHeaderValues
				]);
			}
		} as const satisfies RequestContext;

		return requestContext;
	};
};

type ExpressRequest = {
	method: string;
	headers: Record<string, string | string[] | undefined>;
};

type ExpressResponse = {
	cookie: (name: string, val: string, options?: CookieAttributes) => void;
};

export const express = (): Middleware<[ExpressRequest, ExpressResponse]> => {
	return ({ args }) => {
		const [req, res] = args;
		const requestContext = {
			request: {
				method: req.method,
				headers: createHeadersFromObject(req.headers)
			},
			setCookie: (cookie) => {
				const cookieMaxAge = cookie.attributes.maxAge;
				res.cookie(cookie.name, cookie.value, {
					...cookie.attributes,
					maxAge: cookieMaxAge ? cookieMaxAge * 1000 : cookieMaxAge
				});
			}
		} as const satisfies RequestContext;
		return requestContext;
	};
};

type FastifyRequest = {
	method: string;
	headers: Record<string, string | string[] | undefined>;
};

type FastifyReply = {
	header: (name: string, val: any) => void;
};

export const fastify = (): Middleware<[FastifyRequest, FastifyReply]> => {
	return ({ args }) => {
		const [req, res] = args;
		const requestContext = {
			request: {
				method: req.method,
				headers: createHeadersFromObject(req.headers)
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
			request: event.request,
			sessionCookie: event.cookies.get(sessionCookieName) ?? null,
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
			request: context.request,
			sessionCookie: context.cookies.get(sessionCookieName)?.value || null,
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
			request: event.request,
			sessionCookie: event.cookie.get(sessionCookieName)?.value ?? null,
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
	};
};

export const elysia = (): Middleware<[ElysiaContext]> => {
	return ({ args }) => {
		const [{ request, set }] = args;
		return {
			request,
			setCookie: (cookie) => {
				const setCookieHeader = set.headers["Set-Cookie"] ?? [];
				const setCookieHeaders: string[] = Array.isArray(setCookieHeader)
					? setCookieHeader
					: [setCookieHeader];
				setCookieHeaders.push(cookie.serialize());
				set.headers["Set-Cookie"] = setCookieHeaders;
			}
		};
	};
};

export const lucia = (): Middleware<[RequestContext]> => {
	return ({ args }) => args[0];
};

export const web = (): Middleware<[Request]> => {
	return ({ args }) => {
		const [request] = args;
		const requestContext = {
			request,
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
	req: NodeIncomingMessage;
	res?: NodeOutGoingMessage;
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

type NextHeadersFunction = () => {
	get: (name: string) => string | null;
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
	[NextJsPagesServerContext | NextJsAppServerContext | NextRequest]
> => {
	return ({ args, sessionCookieName, env }) => {
		const [serverContext] = args;

		if ("cookies" in serverContext) {
			// for some reason `"request" in NextRequest` returns true???
			const request =
				typeof serverContext.cookies === "function"
					? (serverContext as NextJsAppServerContext).request
					: (serverContext as NextRequest);

			const readonlyCookieStore =
				typeof serverContext.cookies === "function"
					? serverContext.cookies()
					: serverContext.cookies;

			const sessionCookie =
				readonlyCookieStore.get(sessionCookieName)?.value ?? null;
			const requestContext = {
				request: request ?? {
					method: "GET",
					headers: new Headers()
				},
				sessionCookie,
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
			method: req.method ?? "",
			headers: createHeadersFromObject(req.headers)
		} satisfies LuciaRequest;

		return {
			request,
			setCookie: (cookie) => {
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
		};
	};
};

type NextJsAppServerContext_V3 = {
	headers: NextHeadersFunction;
	cookies: NextCookiesFunction;
};

export const nextjs_future = (): Middleware<
	| [NextJsPagesServerContext]
	| [NextRequest]
	| [requestMethod: string, context: NextJsAppServerContext_V3]
> => {
	return ({ args, sessionCookieName }) => {
		if (args.length === 2) {
			const [requestMethod, context] = args;
			return {
				request: {
					method: requestMethod,
					headers: context.headers()
				},
				setCookie: (cookie) => {
					try {
						context.cookies().set(cookie.name, cookie.value, cookie.attributes);
					} catch {
						// ignore error
						// can't differentiate between page.tsx render (can't set cookies)
						// vs API routes (can set cookies)
					}
				},
				sessionCookie: context.cookies().get(sessionCookieName)?.value ?? null
			};
		}
		if ("req" in args[0]) {
			const [{ req, res }] = args;
			return {
				request: {
					method: req.method ?? "",
					headers: createHeadersFromObject(req.headers)
				},
				setCookie: (cookie) => {
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
			};
		}
		const [request] = args;
		return {
			request,
			setCookie: () => {
				throw new Error(
					"Cookies cannot be set when using the `web()` middleware"
				);
			},
			sessionCookie: request.cookies.get(sessionCookieName)?.value ?? null
		};
	};
};

type H3Event = {
	node: {
		req: NodeIncomingMessage;
		res: NodeOutGoingMessage;
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
		return {
			request: context.req,
			setCookie: (cookie) => {
				context.header("Set-Cookie", cookie.serialize());
			}
		};
	};
};
