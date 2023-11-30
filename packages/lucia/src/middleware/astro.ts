import type { CookieAttributes } from "oslo/cookie";
import type { RequestContext } from "../core.js";
import type { SessionCookie } from "oslo/session";


export class AstroRequestContext implements RequestContext {
	constructor(context: AstroAPIContext) {
		this.method = context.request.method;
		this.headers = context.request.headers;
		this.cookies = context.cookies;
	}

	private cookies: AstroCookies;

	public method: string;
	public headers: Headers;

	public setCookie(cookie: SessionCookie): void {
		this.cookies.set(cookie.name, cookie.value, cookie.attributes);
	}
}

interface AstroCookie {
	value: string | undefined;
}

interface AstroAPIContext {
	request: Request;
	cookies: AstroCookies;
}

interface AstroCookies {
	set: (name: string, value: string, options?: CookieAttributes) => void;
	get: (name: string) => AstroCookie | undefined;
}