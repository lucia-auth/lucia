import type { RequestContext } from "../core.js";
import type { SessionCookie } from "oslo/session";

export class ElysiaRequestContext implements RequestContext {
	constructor(context: ElysiaContext) {
		this.method = context.request.method;
		this.headers = context.request.headers;
		this.context = context;
	}

	private context: ElysiaContext;

	public method: string;
	public headers: Headers;

	public setCookie(cookie: SessionCookie): void {
		const setCookieHeader = this.context.set.headers["Set-Cookie"] ?? [];
		const setCookieHeaders: string[] = Array.isArray(setCookieHeader)
			? setCookieHeader
			: [setCookieHeader];
		setCookieHeaders.push(cookie.serialize());
		this.context.set.headers["Set-Cookie"] = setCookieHeaders;
	}
}

interface ElysiaContext {
	request: Request;
	set: {
		headers: Record<string, string> & {
			["Set-Cookie"]?: string | string[];
		};
	};
}