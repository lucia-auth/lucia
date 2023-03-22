export { lucia as default, SESSION_COOKIE_NAME } from "./auth/index.js";
export { LuciaError, LuciaErrorConstructor } from "./auth/error.js";
export { generateRandomString } from "./utils/crypto.js";
export { serializeCookie } from "./utils/cookie.js";

export type GlobalAuth = Lucia.Auth;
export type GlobalUserAttributes = Lucia.UserAttributes;

export type {
	User,
	UserData,
	Key,
	Session,
	SingleUseKey,
	Configuration,
	PersistentKey,
	Env,
	MinimalRequest,
	Auth
} from "./auth/index.js";
export type {
	Adapter,
	AdapterFunction,
	UserAdapter,
	SessionAdapter
} from "./auth/adapter.type.js";
export type {
	UserSchema,
	KeySchema,
	SessionSchema
} from "./auth/schema.type.js";
