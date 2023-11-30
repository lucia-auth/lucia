import { createHeadersFromObject } from "./utils.js";

import type { CookieAttributes } from "oslo/cookie";
import type { RequestContext } from "../core.js";
import type { SessionCookie } from "oslo/session";
import type { NodeIncomingMessage, NodeOutGoingMessage } from "./node.js";

interface NextCookie {
	name: string;
	value: string;
}

interface NextCookies {
	set: (name: string, value: string, options: CookieAttributes) => void;
	get: (name: string) => NextCookie | undefined;
}

type NextCookiesFunction = () => NextCookies;

interface NextHeaders {
	entries: () => IterableIterator<[string, string]>;
}

type NextHeadersFunction = () => NextHeaders;

interface NextJsAppServerContext {
	headers: NextHeadersFunction;
	cookies: NextCookiesFunction;
}

export class NextJsAppRequestContext implements RequestContext {
	constructor(requestMethod: string, context: NextJsAppServerContext) {
		this.method = requestMethod;
		this.headers = new Headers(Array.from(context.headers().entries()));
		this.cookies = context.cookies();
	}

	private cookies: NextCookies;

	public method: string;
	public headers: Headers;

	public setCookie(cookie: SessionCookie): void {
		this.cookies.set(cookie.name, cookie.value, cookie.attributes);
	}
}

interface NextJsPagesServerContext {
	req: NodeIncomingMessage;
	res: NodeOutGoingMessage;
}

export class NextJsPagesRequestContext implements RequestContext {
	constructor(context: NextJsPagesServerContext) {
		this.res = context.res;
		this.method = context.req.method?.toUpperCase() ?? "";
		this.headers = createHeadersFromObject(context.req.headers);
	}

	private res: NodeOutGoingMessage;

	public method: string;
	public headers: Headers;

	public setCookie(cookie: SessionCookie): void {
		const setCookieHeaderValues =
			this.res
				.getHeader("Set-Cookie")
				?.toString()
				.split(",")
				.filter((val) => val) ?? [];
		this.res.setHeader("Set-Cookie", [cookie.serialize(), ...setCookieHeaderValues]);
	}
}
