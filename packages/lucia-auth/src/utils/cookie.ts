/*
code from https://github.com/jshttp/cookie

the library this code is from is a commonjs library,
which some frameworks don't support (eg. Astro)

also required an external library for ts support
*/

const __toString = Object.prototype.toString;
// eslint-disable-next-line no-control-regex
const fieldContentRegExp = /^[\u0009\u0020-\u007e\u0080-\u00ff]+$/;

interface CookieParseOptions {
	decode?(value: string): string;
}

export const parseCookie = (str: string, options?: CookieParseOptions) => {
	if (typeof str !== "string") {
		throw new TypeError("argument str must be a string");
	}
	const obj: Record<any, string | undefined> = {};
	const opt = options ?? {};
	const dec = opt.decode ?? decode;
	let index = 0;
	while (index < str.length) {
		const eqIdx = str.indexOf("=", index);
		if (eqIdx === -1) {
			break;
		}
		let endIdx = str.indexOf(";", index);
		if (endIdx === -1) {
			endIdx = str.length;
		} else if (endIdx < eqIdx) {
			index = str.lastIndexOf(";", eqIdx - 1) + 1;
			continue;
		}
		const key = str.slice(index, eqIdx).trim();
		// only assign once
		if (undefined === obj[key]) {
			let val = str.slice(eqIdx + 1, endIdx).trim();
			// quoted values
			if (val.charCodeAt(0) === 0x22) {
				val = val.slice(1, -1);
			}
			obj[key] = tryDecode(val, dec);
		}
		index = endIdx + 1;
	}
	return obj;
};

export type CookieAttributes = {
	domain?: string | undefined;
	encode?: (value: string) => string;
	expires?: Date | undefined;
	httpOnly?: boolean | undefined;
	maxAge?: number | undefined;
	path?: string | undefined;
	priority?: "low" | "medium" | "high" | undefined;
	sameSite?: true | false | "lax" | "strict" | "none" | undefined;
	secure?: boolean | undefined;
};

type CookieSerializeOptions = CookieAttributes;

export const serializeCookie = (
	name: string,
	val: string,
	options?: CookieSerializeOptions
) => {
	const opt = options ?? {};
	const enc = opt.encode ?? encode;
	if (!fieldContentRegExp.test(name))
		throw new TypeError("argument name is invalid");

	const value = enc(val);
	if (value && !fieldContentRegExp.test(value))
		throw new TypeError("argument val is invalid");

	let str = name + "=" + value;

	if (null != opt.maxAge) {
		const maxAge = opt.maxAge - 0;
		if (isNaN(maxAge) || !isFinite(maxAge))
			throw new TypeError("option maxAge is invalid");
		str += "; Max-Age=" + Math.floor(maxAge);
	}
	if (opt.domain) {
		if (!fieldContentRegExp.test(opt.domain))
			throw new TypeError("option domain is invalid");
		str += "; Domain=" + opt.domain;
	}
	if (opt.path) {
		if (!fieldContentRegExp.test(opt.path))
			throw new TypeError("option path is invalid");
		str += "; Path=" + opt.path;
	}
	if (opt.expires) {
		const expires = opt.expires;
		if (!isDate(expires) || isNaN(expires.valueOf()))
			throw new TypeError("option expires is invalid");
		str += "; Expires=" + expires.toUTCString();
	}
	if (opt.httpOnly) {
		str += "; HttpOnly";
	}
	if (opt.secure) {
		str += "; Secure";
	}
	if (opt.priority) {
		const priority =
			typeof opt.priority === "string"
				? opt.priority.toLowerCase()
				: opt.priority;
		switch (priority) {
			case "low":
				str += "; Priority=Low";
				break;
			case "medium":
				str += "; Priority=Medium";
				break;
			case "high":
				str += "; Priority=High";
				break;
			default:
				throw new TypeError("option priority is invalid");
		}
	}
	if (opt.sameSite) {
		const sameSite =
			typeof opt.sameSite === "string"
				? opt.sameSite.toLowerCase()
				: opt.sameSite;
		switch (sameSite) {
			case true:
				str += "; SameSite=Strict";
				break;
			case "lax":
				str += "; SameSite=Lax";
				break;
			case "strict":
				str += "; SameSite=Strict";
				break;
			case "none":
				str += "; SameSite=None";
				break;
			default:
				throw new TypeError("option sameSite is invalid");
		}
	}
	return str;
};

const decode = (str: string) => {
	return str.includes("%") ? decodeURIComponent(str) : str;
};

const encode = (val: string) => {
	return encodeURIComponent(val);
};

const isDate = (val: any): val is Date => {
	return __toString.call(val) === "[object Date]" || val instanceof Date;
};

const tryDecode = (str: string, decodeFunction: typeof decode) => {
	try {
		return decodeFunction(str);
	} catch (e) {
		return str;
	}
};
