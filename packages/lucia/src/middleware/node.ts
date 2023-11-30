import { createHeadersFromObject } from "./utils.js";

import type { RequestContext } from "../core.js";
import type { SessionCookie } from "oslo/session";


export class NodeRequestContext implements RequestContext {
	constructor(req: NodeIncomingMessage, res: NodeOutGoingMessage) {
		this.method = req?.method?.toUpperCase() ?? "";
		this.headers = createHeadersFromObject(req.headers);
		this.res = res;
	}

	private res: NodeOutGoingMessage;

	public method: string;
	public headers: Headers;

	public setCookie(cookie: SessionCookie): void {
		let parsedSetCookieHeaderValues: string[] = [];
		const setCookieHeaderValue = this.res.getHeader("Set-Cookie");
		if (typeof setCookieHeaderValue === "string") {
			parsedSetCookieHeaderValues = [setCookieHeaderValue];
		} else if (Array.isArray(setCookieHeaderValue)) {
			parsedSetCookieHeaderValues = setCookieHeaderValue;
		}
		this.res.setHeader("Set-Cookie", [cookie.serialize(), ...parsedSetCookieHeaderValues]);
	}
}

export interface NodeIncomingMessage {
	method?: string;
	headers: Record<string, string | string[] | undefined>;
}

export interface NodeOutGoingMessage {
	getHeader: (name: string) => string | string[] | number | undefined;
	setHeader: (name: string, value: string | number | readonly string[]) => void;
}
