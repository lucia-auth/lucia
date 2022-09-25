## 0.8.9

Sep. 25, 2022

-   [Fix] formData can be accessed from request body after using `validateFormSubmission` [#95](https://github.com/pilcrowOnPaper/lucia-sveltekit/issues/95)

## 0.8.8

Sep. 24, 2022

-   [Fix] Fixed issue where `getSession()` (client) was not getting populated on newer versions of SvelteKit and large page data

## 0.8.7

Sep. 24, 2022

-   Update access token version (v2) - all new tokens issued will be v2 but both version will work (will remove support for v1 in some time)

## 0.8.6

Sep. 20, 2022

Reverts some past changes to improve type safety

-   [Breaking] Removed `handleLoad()`, `handleServerLoad()`, `handleSession()`
-   Add `getSession()` for load functions
-   Add `handleServerSession()`
-   Add `validateFormSubmission()`
-   `signOut()` takes an optional parameter for redirect

## 0.8.5

Sep. 16, 2022

Patches for v0.8.4.

-   [Fix] `getSession()` in `handleServerLoad()` correctly gets tokens [#76](https://github.com/pilcrowOnPaper/lucia-sveltekit/issues/76#issuecomment-1249177890)
-   [Fix] `getSession()` in `handleServerLoad()` gets user from token instead from the database [#78](https://github.com/pilcrowOnPaper/lucia-sveltekit/issues/78)
-   [Fix] Fix types with `setCookie` [#77](https://github.com/pilcrowOnPaper/lucia-sveltekit/issues/77)

## 0.8.4

Sep. 16, 2022

Major changes to Lucia!

-   [Breaking] Removed `Lucia.svelte` wrapper component
-   [Breaking] Replaced `handleAuth` with `handleHooks()`
-   [Breaking] Removed `load`
-   [Breaking] Renamed error `AUTH_INVALID_REQUEST` to `AUTH_INVALID_REQUEST_METHOD`
-   [Breaking] AppWrite adapter is now community supported. the package has been deprecated and moved
-   [Breaking] Renamed `Token.createCookie()` to `Token.cookie()`
-   [Breaking] `signOut()` does not require an access token
-   [Fix] Updated session object is now available in load functions [#63](https://github.com/pilcrowOnPaper/lucia-sveltekit/issues/63)
-   [Fix] Support latest SvelteKit's `cookies` with `setCookie()` [#69](https://github.com/pilcrowOnPaper/lucia-sveltekit/issues/69)
-   Silent refresh is handled with `handleSilentRefresh()`
-   New `handleLoad()`, `handleServerLoad()`, `deleteAllCookies()`
-   `getSession()` can be called from anywhere in the app [#66](https://github.com/pilcrowOnPaper/lucia-sveltekit/issues/66)
-   Token refresh on the server is handled by `handleSession()` inside server load functions

## 0.8.3

Sep. 9, 2022

-   `authenticateUse()` throws an error if the user's password was hashed using the old algorithm (pre-v0.8.0)

## 0.8.2

Sep. 4, 2022

-   [Fix] `handleAuth()` resolves the event only once

## 0.8.1

Sep. 4, 2022

-   [Breaking] Replaced bcrypt (`bcryptjs`) hashing algorithm with scrypt. **Password-based accounts made pre-v0.8.0 are incompatible.**
-   [Breaking] `signOut()` requires an access token
-   [Fix] `signOut()` no longer throws an error on successful attempt
-   New `validateAccessToken()` method
-   `locals` no longer includes token data
-   Throw additional error/warning message in console

## 0.7.1

Aug. 25, 2022

-   [Breaking] Replaced `auth.getAuthSession` with `auth.load`
-   [Fix] Tokens no longer refreshed automatically on API requests

## 0.7.0

Aug. 18, 2022

Add support for `SvelteKit@next-417`+

-   [Breaking] SvelteKit session store is replaced by Lucia's own `session` store
-   [Breaking] `getAuthSession()` is for load function in `/+layout.server.ts`
-   [Breaking] `Lucia` no longer takes in a generic for `UserData`
-   New `Lucia` namespace

## 0.6.2

Aug. 15, 2022

-   [Breaking] All tokens issued before this update is invalid
-   [Fix] `validateRequest` and `validateRequestByCookie` rejects refresh tokens

## 0.6.1

Aug. 14, 2022

-   `Session.cookie` returned by `validateRequest` and `validateRequestByCookie` are the values of existing cookies instead of new cookies

## 0.6.0

Aug. 14, 2022

-   Fixed issues with `Lucia.svelte` wrapper
-   [Breaking] `validateRequest` and `validateRequestByCookie` returns a `Session` instead of `User`

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

-   [Fix] `validateRequest` now checks for the authorization header as stated in the headers instead of cookies
-   New `validateRequestByCookie` to validate requests using cookies - for GET requests

## 0.5.0

Jul. 30, 2022

-   [Breaking] `getUserFromId`, `getUserFromRefreshToken`, `getUserFromIdentifierToken`, `createUser`, and `saveRefreshToken` are renamed to `getUserById`, `getUserByRefreshToken`, `getUserByIdentifierToken`, `setUser`, and `setRefreshToken`
-   [Breaking] `users` and `refresh_tokens` tables are renamed to `user` to `refresh_token`
-   New testing package for adapters

## 0.4.1

Jul. 28, 2022

-   [Fix] Fixed `adapterGetUpdateData()`

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
