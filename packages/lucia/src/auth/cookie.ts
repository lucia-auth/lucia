import { serializeCookie } from "../utils/cookie.js";

import type { Env, Session } from "./index.js";
import type { CookieAttributes } from "../utils/cookie.js";

export const DEFAULT_SESSION_COOKIE_NAME = "auth_session";

export type SessionCookieAttributes = {
	sameSite?: "strict" | "lax";
	path?: string;
	domain?: string;
};

export const createSessionCookie = (
	session: Session | null,
	options: {
		env: Env;
		name: string;
		attributes: SessionCookieAttributes;
		expires: boolean;
	}
) => {
	const getExpiration = () => {
		if (session === null) return 0;
		if (options.expires) {
			return session.idlePeriodExpiresAt;
		}
		return new Date().getTime() + 1000 * 60 * 60 * 24 * 365; // + 1 year
	};
	return new Cookie(
		options.name ?? DEFAULT_SESSION_COOKIE_NAME,
		session?.sessionId ?? "",
		{
			...options.attributes,
			httpOnly: true,
			expires: new Date(getExpiration()),
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
