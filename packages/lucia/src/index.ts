export { Lucia } from "./core.js";
export { LuciaRequest } from "./request.js";
export { Scrypt, LegacyScrypt, generateId } from "./crypto.js";
export { TimeSpan } from "oslo";
export { SessionCookie } from "oslo/session";

export type {
	User,
	Session,
	SessionCookieOptions,
	CSRFProtectionOptions,
	SessionCookieAttributesOptions,
	RequestContext
} from "./core.js";
export type { DatabaseSession, DatabaseUser, Adapter } from "./database.js";
export type { PasswordHashingAlgorithm } from "./crypto.js";

export interface Register {}

import type { Lucia } from "./core.js";

export type RegisteredLucia = Register extends {
	// need to infer to "copy" the generics of Lucia
	Lucia: infer _Lucia;
}
	? _Lucia extends Lucia<any, any>
		? _Lucia
		: Lucia
	: Lucia;

export type DatabaseUserAttributes = Register extends {
	DatabaseUserAttributes: {};
}
	? Register["DatabaseUserAttributes"]
	: {};

export type DatabaseSessionAttributes = Register extends {
	DatabaseSessionAttributes: {};
}
	? Register["DatabaseSessionAttributes"]
	: {};
