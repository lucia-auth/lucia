import type { CookieAttributes } from "oslo/cookie";
import type { RequestContext } from "../core.js";
import type { SessionCookie } from "oslo/session";

export class QwikCityRequestContext implements RequestContext {
	constructor(event: QwikCityRequestEvent) {
		this.method = event.request.method;
		this.headers = event.request.headers;
		this.cookie = event.cookie;
	}

	private cookie: QwikCityCookie;

	public method: string;
	public headers: Headers;

	public setCookie(cookie: SessionCookie): void {
		this.cookie.set(cookie.name, cookie.value, cookie.attributes);
	}
}

interface QwikCityRequestEvent {
	request: Request;
	cookie: QwikCityCookie;
}

interface QwikCityCookie {
	set: (name: string, value: string, options?: CookieAttributes) => void;
	get: (key: string) => QwikCityCookieValue;
}

interface QwikCityCookieValue {
	name: string;
	value: string;
}
