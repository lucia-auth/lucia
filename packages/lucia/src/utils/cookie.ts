/*
code from https://github.com/jshttp/cookie

the library this code is from is a commonjs library,
which some frameworks don't support (eg. Astro)

also required an external library for ts support
*/

export const parseCookie = (str: string): Record<string, string> => {
	const obj: Record<string, string> = {};
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
		if (!(key in obj)) {
			let val = str.slice(eqIdx + 1, endIdx).trim();
			// quoted values
			if (val.charCodeAt(0) === 0x22) {
				val = val.slice(1, -1);
			}
			obj[key] = tryDecode(val);
		}
		index = endIdx + 1;
	}
	return obj;
};

export type CookieAttributes = Partial<{
	domain: string;
	encode: (value: string) => string;
	expires: Date;
	httpOnly: boolean;
	maxAge: number;
	path: string;
	priority: "low" | "medium" | "high";
	sameSite: true | false | "lax" | "strict" | "none";
	secure: boolean;
}>;

type CookieSerializeOptions = CookieAttributes;

export const serializeCookie = (
	name: string,
	val: string,
	options?: CookieSerializeOptions
): string => {
	const opt = options ?? {};
	const enc = opt.encode ?? encodeURIComponent;
	const value = enc(val);
	let str = name + "=" + value;

	if (null != opt.maxAge) {
		const maxAge = opt.maxAge - 0;
		if (isNaN(maxAge) || !isFinite(maxAge)) {
			throw new TypeError("option maxAge is invalid");
		}

		str += "; Max-Age=" + Math.floor(maxAge);
	}
	if (opt.domain) {
		str += "; Domain=" + opt.domain;
	}
	if (opt.path) {
		str += "; Path=" + opt.path;
	}
	if (opt.expires) {
		const expires = opt.expires;
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

const tryDecode = (str: string) => {
	try {
		return decodeURIComponent(str);
	} catch (e) {
		return str;
	}
};
