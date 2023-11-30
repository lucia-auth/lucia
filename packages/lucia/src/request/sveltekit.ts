import type { CookieAttributes } from "oslo/cookie";
import type { RequestContext } from "../core.js";
import type { SessionCookie } from "oslo/session";

export class SvelteKitRequestContext implements RequestContext {
	constructor(event: SvelteKitRequestEvent) {
		this.method = event.request.method;
		this.headers = event.request.headers;
		this.cookies = event.cookies;
	}

	private cookies: SvelteKitCookies;

	public method: string;
	public headers: Headers;
	public setCookie(cookie: SessionCookie): void {
		this.cookies.set(cookie.name, cookie.value, cookie.attributes);
	}
}

interface SvelteKitRequestEvent {
	request: Request;
	cookies: SvelteKitCookies;
}

interface SvelteKitCookies {
	set: (name: string, value: string, options?: CookieAttributes) => void;
	get: (name: string) => string | undefined;
}
