import { Auth } from "./auth/index.js";

export { lucia } from "./auth/index.js";
export { LuciaError } from "./auth/error.js";

export type {
	User,
	Session,
	Configuration,
	Env,
	Auth,
	RequestContext,
	Middleware
} from "./auth/index.js";
export type { Adapter } from "./auth/adapter.js";
export type { UserSchema, SessionSchema } from "./auth/database.js";
export type { AuthRequest } from "./auth/request.js";
export type { LuciaErrorConstructor } from "./auth/error.js";

export interface Register {}

export type RegisteredAuth = Register extends {
	Auth: Auth;
}
	? Register["Auth"]
	: Auth;

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
