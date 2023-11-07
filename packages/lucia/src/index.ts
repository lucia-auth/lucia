export { Lucia } from "./auth/index.js";
export { AuthRequest } from "./auth/request.js";
export {
	generateScryptHash as generateLegacyLuciaPasswordHash,
	verifyScryptHash as verifyLegacyLuciaPasswordHash
} from "./utils/crypto.js";
export { TimeSpan } from "oslo";

export type {
	User,
	Session,
	ExperimentalOptions,
	SessionCookieOptions,
	CSRFProtectionOptions,
	SessionCookieAttributesOptions,
	RequestContext,
	Middleware
} from "./auth/index.js";
export type {
	DatabaseSession,
	DatabaseUser,
	Adapter,
	SessionAdapter
} from "./auth/database.js";

export interface Register {}

import type { Lucia } from "./auth/index.js";

export type RegisteredLucia = Register extends {
	// need to infer to "copy" the generics of Lucia
	Lucia: infer _Lucia;
}
	? _Lucia extends Lucia<any, any, any>
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
