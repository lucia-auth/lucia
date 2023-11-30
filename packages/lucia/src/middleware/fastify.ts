import { createHeadersFromObject } from "./utils.js";

import type { RequestContext } from "../core.js";
import type { SessionCookie } from "oslo/session";

export class FastifyRequestContext implements RequestContext {
	constructor(request: FastifyRequest, res: FastifyReply) {
		this.method = request.method;
		this.headers = createHeadersFromObject(request.headers);
		this.res = res;
	}

	private res: FastifyReply;

	public method: string;
	public headers: Headers;

	public setCookie(cookie: SessionCookie): void {
		this.res.header("Set-Cookie", [cookie.serialize()]);
	}
}

interface FastifyRequest {
	method: string;
	headers: Record<string, string | string[] | undefined>;
}

interface FastifyReply {
	header: (name: string, value: any) => void;
}
