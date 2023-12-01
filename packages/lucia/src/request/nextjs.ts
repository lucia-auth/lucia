import type { CookieAttributes } from "oslo/cookie";
import type { RequestContext } from "../core.js";
import type { SessionCookie } from "oslo/session";

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

interface NextJsServerContext {
	headers: NextHeadersFunction;
	cookies: NextCookiesFunction;
}

export class NextJsRequestContext implements RequestContext {
	constructor(requestMethod: string, context: NextJsServerContext) {
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
