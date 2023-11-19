import type { CookieAttributes } from "oslo/cookie";
import type { Middleware, RequestContext } from "../core.js";

interface NodeIncomingMessage {
	method?: string;
	headers: Record<string, string | string[] | undefined>;
}

interface NodeOutGoingMessage {
	getHeader: (name: string) => string | string[] | number | undefined;
	setHeader: (name: string, value: string | number | readonly string[]) => void;
}

export function node(): Middleware<[NodeIncomingMessage, NodeOutGoingMessage]> {
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
}

interface ExpressRequest {
	method: string;
	headers: Record<string, string | string[] | undefined>;
}

interface ExpressResponse {
	cookie: (name: string, val: string, options?: CookieAttributes) => void;
}

export function express(): Middleware<[ExpressRequest, ExpressResponse]> {
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
}

interface FastifyRequest {
	method: string;
	headers: Record<string, string | string[] | undefined>;
}

interface FastifyReply {
	header: (name: string, val: any) => void;
}

export function fastify(): Middleware<[FastifyRequest, FastifyReply]> {
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
}

interface SvelteKitRequestEvent {
	request: Request;
	cookies: {
		set: (name: string, value: string, options?: CookieAttributes) => void;
		get: (name: string) => string | undefined;
	};
}

export function sveltekit(): Middleware<[SvelteKitRequestEvent]> {
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
}

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

export function astro(): Middleware<[AstroAPIContext]> {
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
}

interface QwikRequestEvent {
	request: Request;
	cookie: {
		set: (name: string, value: string, options?: CookieAttributes) => void;
		get: (key: string) => {
			value: string;
		} | null;
	};
}

export function qwik(): Middleware<[QwikRequestEvent]> {
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
}

interface ElysiaContext {
	request: Request;
	set: {
		headers: Record<string, string> & {
			["Set-Cookie"]?: string | string[];
		};
	};
}

export function elysia(): Middleware<[ElysiaContext]> {
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
}

export function lucia(): Middleware<[RequestContext]> {
	return ({ args }) => args[0];
}

export function web(): Middleware<[Request]> {
	return ({ args }) => {
		const [request] = args;
		const requestContext = {
			request,
			setCookie: () => {
				throw new Error("Cookies cannot be set when using the `web()` middleware");
			}
		} as const satisfies RequestContext;
		return requestContext;
	};
}

interface NextJsPagesServerContext {
	req: NodeIncomingMessage;
	res?: NodeOutGoingMessage;
}

interface NextCookie {
	name: string;
	value: string;
}

type NextCookiesFunction = () => {
	set: (name: string, value: string, options: CookieAttributes) => void;
	get: (name: string) => NextCookie | undefined;
};

type NextHeadersFunction = () => {
	entries: () => IterableIterator<[string, string]>;
};

interface NextRequest extends Request {
	cookies: {
		get: (name: string) => NextCookie | undefined;
	};
}

interface NextJsAppServerContext {
	headers: NextHeadersFunction;
	cookies: NextCookiesFunction;
}

export function nextjs(): Middleware<
	| [NextJsPagesServerContext]
	| [NextRequest]
	| [requestMethod: string, context: NextJsAppServerContext]
> {
	return ({ args, sessionCookieName }) => {
		if (args.length === 2) {
			const [requestMethod, context] = args;
			return {
				request: {
					method: requestMethod,
					headers: new Headers(Array.from(context.headers().entries()))
				},
				setCookie: (cookie) => {
					context.cookies().set(cookie.name, cookie.value, cookie.attributes);
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
					res.setHeader("Set-Cookie", [cookie.serialize(), ...setCookieHeaderValues]);
				}
			};
		}
		const [request] = args;
		return {
			request,
			setCookie: () => {
				throw new Error("Cookies cannot be set when using the `web()` middleware");
			},
			sessionCookie: request.cookies.get(sessionCookieName)?.value ?? null
		};
	};
}

interface H3Event {
	node: {
		req: NodeIncomingMessage;
		res: NodeOutGoingMessage;
	};
}

export function h3(): Middleware<[H3Event]> {
	const nodeMiddleware = node();

	return ({ args, sessionCookieName }) => {
		const [context] = args;
		return nodeMiddleware({
			args: [context.node.req, context.node.res],
			sessionCookieName
		});
	};
}

interface HonoContext {
	req: {
		url: string;
		method: string;
		headers: Headers;
	};
	header: (name: string, value: string) => void;
}

export function hono(): Middleware<[HonoContext]> {
	return ({ args }) => {
		const [context] = args;
		return {
			request: context.req,
			setCookie: (cookie) => {
				context.header("Set-Cookie", cookie.serialize());
			}
		};
	};
}

export function createHeadersFromObject(
	headersObject: Record<string, string | string[] | null | undefined>
): Headers {
	const headers = new Headers();
	for (const [key, value] of Object.entries(headersObject)) {
		if (value === null || value === undefined) continue;
		if (typeof value === "string") {
			headers.set(key, value);
		} else {
			for (const item of value) {
				headers.append(key, item);
			}
		}
	}
	return headers;
}
