# Changelog

## v0.14.1

-   Add `sessionCookieOptions` and `deleteCookieOptions` config

## v0.14.0

-   [Breaking] `createSession()` and `renewSession()` returns `Session`
-   [Breaking] Remove `deleteAllCookies()`
-   Add `setSession()` and `clearSession()` method inside `locals`

## v0.13.2

-   `UserData` type removes optionality from user attributes

## v0.13.1

-   [Fix] Fix issue where hooks wasn't validating request origin

## v0.13.0

-   [Breaking] `handleHooks()` automatically validates and renew session
-   [Breaking] `User` is `{ userId: string }` by default - additional data stored in `user` table are no longer automatically added
-   [Breaking] Rename `userData` fields to `attributes` for `createUser()`
-   [Breaking] Rename `updateUserData()` to `updateUserAttributes()`
-   [Breaking] `setUser()` adapter method returns `User` instead of user id
-   [Breaking] Rename `Lucia.UserData` to `Lucia.UserAttributes`
-   [Breaking] Rename `userData` to `attributes` field for `updateUser()` adapter method
-   [Breaking] `Lucia.Auth` and `Lucia.UserAttributes` type must be configured for `transformUserData()`
-   [Breaking] Remove `validateRequestEvent()` method
-   [Breaking] `setUser()` adapter method returns created `User` instead of user id
-   Add `validateRequest()` method
-   Add `transformUserData()` config

## v0.12.0

-   [Breaking] The `session` table should be reset and rebuilt
-   [Breaking] The `refresh_token` table is no longer required
-   [Breaking] Remove `refreshSession()`, `deleteExpiredUserSessions()`, `validateAccessToken()`, `validateRefreshToken()`, `invalidateRefreshToken()` method
-   [Breaking] Replace `validateRequest()` with `validateRequestEvent()`, attempts session renewal if invalid
-   [Breaking] Remove `setCookie()`
-   [Breaking] Remove session refresh REST api and `refreshSession()` client API
-   [Breaking] `createSession()` returns `setSessionCookie()` and `idlePeriodExpires` (removed `tokens`)
-   [Breaking] Remove `AUTH_INVALID_ACCESS_TOKEN`, `AUTH_INVALID_REFRESH_TOKEN`, `AUTH_DUPLICATE_ACCESS_TOKEN`, `AUTH_DUPLICATE_REFRESH_TOKEN` error
-   [Breaking] Replace `getUserById()` with `getUser()` adapter method
-   [Breaking] Remove `getUserIdByRefreshToken()`, `getUserByAccessToken()`, `getSessionByAccessToken()`, `deleteSessionByAccessToken()`, `setRefreshToken()`, `deleteRefreshToken()`, `deleteRefreshTokensByUserId()` adapter method
-   [Breaking] `getUserSession()` returns both `Session` and `User`
-   [Breaking] Adapter requires `getSessionAndUserBySessionId()`, `getSession()`, `getSessionsByUserId()`, `setSession()`, `deleteSession()`, `deleteSessionsByUserId()` method
-   [Breaking] `session` table schema requires `idle_expires` column
-   [Breaking] `parseRequest()` returns the sessionId
-   `parseRequest()` is a sync function
-   New `validateSession()`, `generateSessionId()`, `createSession()`, `renewSession()`, `invalidateSession()`, `deleteDeadUserSessions()` method
-   New `sessionTimeout` and `idlePeriodTimeout` config

## v0.10.2

-   [Breaking] Revert camelCase/snake_case conversion for `userData`. Keys of `userData` now respect your database column names.

## v0.10.1

-   [Fix] Fix return type for `parseRequest()`.
