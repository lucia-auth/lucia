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
	env: Env,
	cookieConfig: {
		name: string;
		attributes: SessionCookieAttributes;
	}
) => {
	return new Cookie(
		cookieConfig.name ?? DEFAULT_SESSION_COOKIE_NAME,
		session?.sessionId ?? "",
		{
			...cookieConfig.attributes,
			httpOnly: true,
			expires: new Date(session?.idlePeriodExpiresAt ?? 0),
			secure: env === "PROD"
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
