## 0.5.8

Aug. 4, 2022

-   `lucia-sveltekit/types` exports type `Error`

## 0.5.5

Aug. 4, 2022

-   Fixed broken package.

## 0.5.3

Aug. 3, 2022

-   [Breaking] Replaced `autoRefreshTokens` with `Lucia` wrapper

## 0.5.1

Aug. 3, 2022

-   [fix] `validateRequest` now checks for the authorization header as stated in the headers instead of cookies
-   New `validateRequestByCookie` to validate requests using cookies - for GET requests

## 0.5.0

Jul. 30, 2022

-   [Breaking] `getUserFromId`, `getUserFromRefreshToken`, `getUserFromIdentifierToken`, `createUser`, and `saveRefreshToken` are renamed to `getUserById`, `getUserByRefreshToken`, `getUserByIdentifierToken`, `setUser`, and `setRefreshToken`
-   [Breaking] `users` and `refresh_tokens` tables are renamed to `user` to `refresh_token`
-   New testing package for adapters

## 0.4.1

Jul. 28, 2022

-   [fix] Fixed `adapterGetUpdateData()`

## 0.4.0

Jul. 28, 2022

-   [Breaking] Adapters now need `getUserById` and `updateUser` methods
-   New `invalidateRefreshToken()`, `updateUserData()`, `updateUserIdentifierToken()`, `resetUserPassword()`, `getUserById()`, and `createUserSession()`.
-   New `AUTH_INVALID_USER_ID` error message
-   New `adapterGetUpdateData()` can be used to convert adapter's `updateUserData()` `data` column to a single object.

## 0.3.5

Jul. 27, 2022

-   Fixed bug where `autoTokenRefresh` was not updating refresh token inside the session object on token refresh

## 0.3.3, 0.3.4

Jul. 26, 2022

-   Can now define types for `user_data`

## 0.3.2

Jul. 23, 2022

-   [Breaking] Changed `LuciaError` to `Error`

## 0.3.1

Jul. 23, 2022

-   Fixed `AUTH_DUPLICATE_IDENTIFER_TOKEN` to `AUTH_DUPLICATE_IDENTIFIER_TOKEN`

## 0.3.0

Lucia now saves an encrypted version of the refresh token inside cookies instead of the refresh token. Lucia also rotates refresh tokens for added security.

Jul. 21, 2022

-   [Breaking] Lucia saves `encrypted_refresh_token` instead of `refresh_token`
-   [Breaking] `authenticateUser()` and `createUser()` returns a different object
-   [Breaking] Lucia requires `env` config
-   [Breaking] `fingerprint` cookie is renamed to `fingerprint_token`
-   [Breaking] Refresh tokens are re-issued when access tokens are refreshed and the old token is invalidated.
-   [Breaking] `autoRefreshAccessToken` and `refreshAccessToken` (client) are replaced by `autoRefreshTokens` and `refreshTokens` respectively
-   [Breaking] All refresh tokens prior to this update is invalid
-   [Breaking] types `LuciaUser` and `LuciaSvelteKitSession` is renamed to `User` and `SvelteKitSession`
-   [Breaking] `refreshAccessToken` (server) is replaced by `refreshTokens`
-   All refresh tokens belonging to a user will be invalidated if a token refresh is attempted using a previous refresh token
-   Refresh tokens and fingerprint tokens are now stored for 1 year instead of 5
-   All cookies are deleted if a invalid refresh token or fingerprint token is passed

## 0.2.7

Jul. 20, 2022

-   [Breaking] `verifyRequest()` is replaced to `validateRequest()`

## 0.2.6

Jul. 19, 2022

-   [Breaking] `getUser()` returns `null` if a user that matches the input doesn't exist
-   [Breaking] `getUserFromRequest()` is replaced to `verifyRequest()`
-   Added `LuciaSvelteKitSession` type for adding types to SvelteKit's session
