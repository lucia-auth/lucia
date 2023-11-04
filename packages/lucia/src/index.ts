import { Auth } from "./auth/index.js";

export { lucia } from "./auth/index.js";

export type {
	User,
	Session,
	Configuration,
	Env,
	Auth,
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
