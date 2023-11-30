import type { RequestContext } from "../core.js";
import type { SessionCookie } from "oslo/session";

export class HonoRequestContext implements RequestContext {
	constructor(context: HonoContext) {
		this.method = context.req.method;
		this.headers = context.req.headers;
		this.context = context;
	}

	private context: HonoContext;

	public method: string;
	public headers: Headers;

	public setCookie(cookie: SessionCookie): void {
		this.context.header("Set-Cookie", cookie.serialize());
	}
}

interface HonoContext {
	req: {
		url: string;
		method: string;
		headers: Headers;
	};
	header: (name: string, value: string) => void;
}
