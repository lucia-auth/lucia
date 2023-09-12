import { serializeCookie } from "../utils/cookie.js";

import type { Env, Session } from "./index.js";
import type { CookieAttributes } from "../utils/cookie.js";

export const DEFAULT_SESSION_COOKIE_NAME = "auth_session";

type SessionCookieAttributes = {
	sameSite?: "strict" | "lax";
	path?: string;
	domain?: string;
};

export type SessionCookieConfiguration = {
	name?: string;
	attributes?: SessionCookieAttributes;
	expires?: boolean;
};

const defaultSessionCookieAttributes: SessionCookieAttributes = {
	sameSite: "lax",
	path: "/"
};

export const createSessionCookie = (
	session: Session | null,
	options: { env: Env; cookie: SessionCookieConfiguration }
): Cookie => {
	let expires: number;
	if (session === null) {
		expires = 0;
	} else if (options.cookie.expires !== false) {
		expires = session.idlePeriodExpiresAt.getTime();
	} else {
		expires = Date.now() + 1000 * 60 * 60 * 24 * 365; // + 1 year
	}
	return new Cookie(
		options.cookie.name ?? DEFAULT_SESSION_COOKIE_NAME,
		session?.sessionId ?? "",
		{
			...(options.cookie.attributes ?? defaultSessionCookieAttributes),
			httpOnly: true,
			expires: new Date(expires),
			secure: options.env === "PROD"
		}
	);
};

export class Cookie {
	constructor(name: string, value: string, options: CookieAttributes) {
		this.name = name;
		this.value = value;
		this.attributes = options;
	}
	public readonly name: string;
	public readonly value: string;
	public readonly attributes: CookieAttributes;
	public readonly serialize = () => {
		return serializeCookie(this.name, this.value, this.attributes);
	};
}
