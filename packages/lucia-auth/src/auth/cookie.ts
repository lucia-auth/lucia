import { Env, Session } from "../types.js";
import { type CookieAttributes, serializeCookie } from "../utils/cookie.js";

export const SESSION_COOKIE_NAME = "auth_session";

export type CookieOption = {
	sameSite?: "strict" | "lax";
	path?: string;
	domain?: string;
};

export const createSessionCookie = (
	session: Session | null,
	env: Env,
	options: CookieOption
) => {
	return new Cookie(SESSION_COOKIE_NAME, session?.sessionId ?? "", {
		...options,
		httpOnly: true,
		expires: new Date(session?.idlePeriodExpires ?? 0),
		secure: env === "PROD"
	});
};

export class Cookie {
	constructor(name: string, value: string, options: CookieAttributes) {
		this.name = name;
		this.value = value;
		this.attributes = options;
	}
	public name: string;
	public value: string;
	public attributes: CookieAttributes;
	public serialize = () => {
		return serializeCookie(this.name, this.value, this.attributes);
	};
}
