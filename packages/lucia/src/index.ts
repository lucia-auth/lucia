export { lucia as default } from "./auth/index.js";
export { SESSION_COOKIE_NAME, Cookie } from "./auth/cookie.js";
export { LuciaError, LuciaErrorConstructor } from "./auth/error.js";
export { generateRandomString } from "./utils/nanoid.js";
export { serializeCookie } from "./utils/cookie.js";

export type GlobalAuth = Lucia.Auth;
export type GlobalDatabaseUserAttributes = Lucia.DatabaseUserAttributes;
export type GlobalDatabaseSessionAttributes = Lucia.DatabaseSessionAttributes;

export type {
	User,
	Key,
	Session,
	Configuration,
	Env,
	Auth
} from "./auth/index.js";
export type {
	Adapter,
	InitializeAdapter,
	UserAdapter,
	SessionAdapter
} from "./auth/adapter.js";
export type { UserSchema, KeySchema, SessionSchema } from "./auth/schema.js";
export type {
	RequestContext,
	Middleware,
	AuthRequest
} from "./auth/request.js";
