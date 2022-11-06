# CHANGELOG

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
