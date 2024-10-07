import type { TimeSpan } from "./date.js";

export interface CookieAttributes {
	secure?: boolean;
	path?: string;
	domain?: string;
	sameSite?: "lax" | "strict" | "none";
	httpOnly?: boolean;
	maxAge?: number;
	expires?: Date;
}

export function serializeCookie(name: string, value: string, attributes: CookieAttributes): string {
	const keyValueEntries: Array<[string, string] | [string]> = [];
	keyValueEntries.push([encodeURIComponent(name), encodeURIComponent(value)]);
	if (attributes?.domain !== undefined) {
		keyValueEntries.push(["Domain", attributes.domain]);
	}
	if (attributes?.expires !== undefined) {
		keyValueEntries.push(["Expires", attributes.expires.toUTCString()]);
	}
	if (attributes?.httpOnly) {
		keyValueEntries.push(["HttpOnly"]);
	}
	if (attributes?.maxAge !== undefined) {
		keyValueEntries.push(["Max-Age", attributes.maxAge.toString()]);
	}
	if (attributes?.path !== undefined) {
		keyValueEntries.push(["Path", attributes.path]);
	}
	if (attributes?.sameSite === "lax") {
		keyValueEntries.push(["SameSite", "Lax"]);
	}
	if (attributes?.sameSite === "none") {
		keyValueEntries.push(["SameSite", "None"]);
	}
	if (attributes?.sameSite === "strict") {
		keyValueEntries.push(["SameSite", "Strict"]);
	}
	if (attributes?.secure) {
		keyValueEntries.push(["Secure"]);
	}
	return keyValueEntries.map((pair) => pair.join("=")).join("; ");
}

export function parseCookies(header: string): Map<string, string> {
	const cookies = new Map<string, string>();
	const items = header.split("; ");
	for (const item of items) {
		const pair = item.split("=");
		const rawKey = pair[0];
		const rawValue = pair[1] ?? "";
		if (!rawKey) continue;
		cookies.set(decodeURIComponent(rawKey), decodeURIComponent(rawValue));
	}
	return cookies;
}

export class CookieController {
	constructor(
		cookieName: string,
		baseCookieAttributes: CookieAttributes,
		cookieOptions?: {
			expiresIn?: TimeSpan;
		}
	) {
		this.cookieName = cookieName;
		this.cookieExpiresIn = cookieOptions?.expiresIn ?? null;
		this.baseCookieAttributes = baseCookieAttributes;
	}

	public cookieName: string;

	private cookieExpiresIn: TimeSpan | null;
	private baseCookieAttributes: CookieAttributes;

	public createCookie(value: string): Cookie {
		return new Cookie(this.cookieName, value, {
			...this.baseCookieAttributes,
			maxAge: this.cookieExpiresIn?.seconds()
		});
	}

	public createBlankCookie(): Cookie {
		return new Cookie(this.cookieName, "", {
			...this.baseCookieAttributes,
			maxAge: 0
		});
	}

	public parse(header: string): string | null {
		const cookies = parseCookies(header);
		return cookies.get(this.cookieName) ?? null;
	}
}

export class Cookie {
	constructor(name: string, value: string, attributes: CookieAttributes) {
		this.name = name;
		this.value = value;
		this.attributes = attributes;
	}

	public name: string;
	public value: string;
	public attributes: CookieAttributes;

	public serialize(): string {
		return serializeCookie(this.name, this.value, this.attributes);
	}
}
