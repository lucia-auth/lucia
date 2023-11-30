import { createHeadersFromObject } from "./utils.js";

import type { CookieAttributes } from "oslo/cookie";
import type { RequestContext } from "../core.js";
import type { SessionCookie } from "oslo/session";

export class ExpressRequestContext implements RequestContext {
	constructor(req: ExpressRequest, res: ExpressResponse) {
		(this.method = req.method), (this.headers = createHeadersFromObject(req.headers));
		this.res = res;
	}

	private res: ExpressResponse;

	public method: string;
	public headers: Headers;

	public setCookie(cookie: SessionCookie) {
		const cookieMaxAge = cookie.attributes.maxAge;
		this.res.cookie(cookie.name, cookie.value, {
			...cookie.attributes,
			maxAge: cookieMaxAge ? cookieMaxAge * 1000 : cookieMaxAge
		});
	}
}

interface ExpressRequest {
	method: string;
	headers: Record<string, string | string[] | undefined>;
}

interface ExpressResponse {
	cookie: (name: string, val: string, options?: CookieAttributes) => void;
}
