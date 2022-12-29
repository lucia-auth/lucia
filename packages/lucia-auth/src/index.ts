export { lucia as default, type Configurations, SESSION_COOKIE_NAME } from "./auth/index.js";
export { LuciaError, LuciaErrorConstructor } from "./auth/error.js";
export { generateRandomString } from "./utils/crypto.js";
export { serializeCookie } from "./utils/cookie.js";
export * from "./types.js";
export type GlobalAuth = Lucia.Auth;
export type GlobalUserAttributes = Lucia.UserAttributes;
