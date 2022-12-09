# CHANGELOG

## 0.3.0

- [Breaking] `getSession()` returns both active and idle sessions
- [Breaking] `Session.expires`, `Session.idlePeriodExpires` are `Date` objects
- [Breaking] `renewSession()`, `validateSession()`, `validateSessionUser()` no longer sets session cookie using the provided function parameter
- [Breaking] Rename `Cookie.options` to `Cookie.attributes`
- [Breaking] Rename `Session.expires` to `Session.activePeriodExpires`
- [Breaking] Rename `Config.sessionTimeout` to `Config.sessionTimeout.activePeriod`, `Config.idlePeriodTimeout` to `Config.sessionTimeout.idlePeriod`
- [Breaking] Remove `Config.deleteCookieOption`
- [Breaking] Rename `Config.sessionCookieOption` to `Config.sessionCookie`
- `getSession()`, `getSessionUser()`, `renewSession()`, `validateSessionUser()`, `validateSession()` deletes the target session from the database if dead by default
- `updateUserProviderId()`, `updateUserAttributes()`, `createSession()` deletes the target user's dead sessions from the database by default
- Add `state`, `isFresh` property to `Session`
- Add `autoDatabaseCleanup` config

## 0.2.2

- [Fix] Ignore `getSessionAndUserBySessionId()` if a normal adapter is provided as a user or session adapter

## 0.2.1

- Remove node dependencies (`crypto`, `util`) [#236](https://github.com/pilcrowOnPaper/lucia-auth/issues/236)
- Adds `@noble/hashes` as dependency
- Use block size (`r`) of `16` for hashing passwords with scrypt
- Add `configs.hash.generate()` and `configs.hash.validate()` for custom hashing implementation
- Normalize password string on hashing

## 0.2.0

- [Breaking] Remove `validateRequest()` and `getSessionUserFromRequest()`
- [Breaking] Replace `parseRequest()` with `validateRequestHeaders()`
- [Breaking] `renewSession()` requires `setSessionCookie()` param and sets cookies
- [Breaking] `validateSession()` renews idle sessions
- [Breaking] `getSessionUser()` no longers renews idle sessions
- Add `validateSessionUser()`, `getSession()`, `getSessionUser()`, `SESSION_COOKIE_NAME`

## 0.1.4

- [Breaking] Params for `setCookie()` params for `validateRequest()` and `getSessionUserFromRequest()` is now `Session | null` instead of a `string`
- [Breaking] `createSessionCookies()`^ returns an array of `Cookie`
- [Breaking] Remove `createBlankSessionCookies()`

## 0.1.3

- Export `Lucia.Auth` and `Lucia.UserAttributes`
- Remove `cookie` and `cli-color` dependency

## 0.1.2

- [Breaking] `validateRequest()` requires `setCookie()` parameter
- Add `getSessionUserFromRequest()`

## 0.1.1

- Make input type of request for `parseRequest()` and `validateRequest()` as minimal as possible
