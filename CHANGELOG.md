# Changelog

## v0.12.0

-   [Breaking] The `session` table should be reset and rebuilt
-   [Breaking] The `refresh_token` table is no longer required
-   [Breaking] Removed `refreshSession()`, `deleteExpiredUserSessions()`, `validateAccessToken()`, `validateRefreshToken()`, `invalidateRefreshToken()` method
-   [Breaking] Replaced `validateRequest()` with `validateRequestEvent()`, attempts session renewal if invalid
-   [Breaking] Removed `setCookie()`
-   [Breaking] Removed session refresh REST api and `refreshSession()` client API
-   [Breaking] `createSession()` returns `setSessionCookie()` and `idlePeriodExpires` (removed `tokens`)
-   [Breaking] Removed `AUTH_INVALID_ACCESS_TOKEN`, `AUTH_INVALID_REFRESH_TOKEN`, `AUTH_DUPLICATE_ACCESS_TOKEN`, `AUTH_DUPLICATE_REFRESH_TOKEN` error
-   [Breaking] Replaced `getUserById()` with `getUser()` adapter method
-   [Breaking] Removed `getUserIdByRefreshToken()`, `getUserByAccessToken()`, `getSessionByAccessToken()`, `deleteSessionByAccessToken()`, `setRefreshToken()`, `deleteRefreshToken()`, `deleteRefreshTokensByUserId()` adapter method
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

-   [Fix] Fixed return type for `parseRequest()`.
