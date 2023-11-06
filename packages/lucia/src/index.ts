export { Lucia } from "./auth/index.js";

export type {
	User,
	Session,
	ExperimentalOptions,
	SessionCookieOptions,
	CSRFProtectionOptions,
	RequestContext,
	Middleware
} from "./auth/index.js";
export type {
	DatabaseSession,
	DatabaseUser,
	Adapter
} from "./auth/database.js";
export type { AuthRequest } from "./auth/request.js";

export interface Register {}

import { Lucia } from "./auth/index.js";

export type RegisteredLucia = Register extends {
	// need to infer to "copy" the generics of Lucia
	Lucia: infer _Lucia;
}
	? _Lucia extends Lucia
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
