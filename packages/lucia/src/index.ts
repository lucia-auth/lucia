export { Lucia } from "./auth/index.js";

export type {
	User,
	Session,
	Configuration,
	Env,
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

export type RegisteredAuth = Register extends {
	Lucia: Lucia;
}
	? Register["Lucia"]
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
