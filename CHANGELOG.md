# lucia

## 1.0.0-beta.1

### Patch changes

- [#735](https://github.com/pilcrowOnPaper/lucia/pull/735) by [@pilcrowOnPaper](https://github.com/pilcrowOnPaper) : Fix `Session.fresh` fixed to `false`

## 1.0.0-beta.0

### Major changes

- [#682](https://github.com/pilcrowOnPaper/lucia/pull/682) by [@pilcrowOnPaper](https://github.com/pilcrowOnPaper) : Update configuration

    - Remove `autoDatabaseCleanup`

    - Remove `transformDatabaseUser()` (see `transformUserAttributes()`)

    - Replace `generateCustomUserId()` with `generateUserId()`

    - Replace `hash` with `passwordHash`

    - Replace `origin` with `requestOrigins`

    - Replace `sessionCookie` with `sessionCookie.attributes`

    - Add `sessionCookie.name` for setting session cookie name

    - Add `transformUserAttributes()` for defining user attributes (**`userId` is automatically included**)

    - Add `transformSessionAttributes()` for defining session attributes

- [#682](https://github.com/pilcrowOnPaper/lucia/pull/682) by [@pilcrowOnPaper](https://github.com/pilcrowOnPaper) : Update `Auth` methods:

    - Remove `getSessionUser()`

    - Remove `validateSessionUser()`

    - Remove `parseRequestHeaders()`

    - Add `readSessionCookie()`

    - Add `validateRequestOrigin()`

- [#682](https://github.com/pilcrowOnPaper/lucia/pull/682) by [@pilcrowOnPaper](https://github.com/pilcrowOnPaper) : Remove primary keys

    - Remove `Key.primary`

    - Rename `Auth.createUser()` params `options.primaryKey` to `options.key`

    - Remove column `key(primary_key)`

- [#682](https://github.com/pilcrowOnPaper/lucia/pull/682) by [@pilcrowOnPaper](https://github.com/pilcrowOnPaper) : Remove single use keys

    - **Lucia v2 no longer supports `@lucia-auth/tokens`**

    - Remove `Session.type`

    - Update `Auth.createKey()` params

    - Remove column `key(expires)`

- [#682](https://github.com/pilcrowOnPaper/lucia/pull/682) by [@pilcrowOnPaper](https://github.com/pilcrowOnPaper) : Update `Session`

    - Remove `Session.userId`

    - Add `Session.user`

- [#682](https://github.com/pilcrowOnPaper/lucia/pull/682) by [@pilcrowOnPaper](https://github.com/pilcrowOnPaper) : Remove `AuthRequest.validateUser()`

- [#682](https://github.com/pilcrowOnPaper/lucia/pull/682) by [@pilcrowOnPaper](https://github.com/pilcrowOnPaper) : Introduce custom session attributes

    - Update `Auth.createSession()` params

    - Update behavior of `Auth.renewSession()` to include attributes of old session to renewed session automatically

- [#682](https://github.com/pilcrowOnPaper/lucia/pull/682) by [@pilcrowOnPaper](https://github.com/pilcrowOnPaper) : Overhaul adapter API

    - Remove `UserAdapter.updateUserAttributes()`

    - Remove `UserAdapter.deleteNonPrimaryKey()`

    - Remove `UserAdapter.updateKeyPassword()`

    - Remove `Adapter?.getSessionAndUserBySessionId()`

    - Update `UserAdapter.setUser()` params

    - Remove `UserAdapter.getKey()` params `shouldDataBeDeleted()`

    - Add `UserAdapter.updateUser()`

    - Add `UserAdapter.deleteKey()`

    - Add `UserAdapter.updateKey()`

    - Add `SessionAdapter.updateSession()`

    - Add `Adapter.getSessionAndUser()`

    - Rename type `AdapterFunction` to `InitializeAdapter`

- [#682](https://github.com/pilcrowOnPaper/lucia/pull/682) by [@pilcrowOnPaper](https://github.com/pilcrowOnPaper) : Update adapter specifications

    - Insert and update methods do not return anything

    - Insert and update methods for sessions and keys may optionally throw a Lucia error on invalid user id

    - Insert methods do not throw Lucia errors on duplicate session and user ids

- [#682](https://github.com/pilcrowOnPaper/lucia/pull/682) by [@pilcrowOnPaper](https://github.com/pilcrowOnPaper) : Remove errors:

    - `AUTH_DUPLICATE_SESSION_ID`

    - `AUTO_USER_ID_GENERATION_NOT_SUPPORTED`

    - `AUTH_EXPIRED_KEY`

- [#682](https://github.com/pilcrowOnPaper/lucia/pull/682) by [@pilcrowOnPaper](https://github.com/pilcrowOnPaper) : Remove auto database clean up functionality

- [#682](https://github.com/pilcrowOnPaper/lucia/pull/682) by [@pilcrowOnPaper](https://github.com/pilcrowOnPaper) : Update `Middleware` takes a new `Context` params

- [#682](https://github.com/pilcrowOnPaper/lucia/pull/682) by [@pilcrowOnPaper](https://github.com/pilcrowOnPaper) : Update exports:

    - **Replace default export with named `lucia()`**

    - Removed `generateRandomString()`

    - Removed `serializeCookie()`

    - Removed `Cookie`

- [#682](https://github.com/pilcrowOnPaper/lucia/pull/682) by [@pilcrowOnPaper](https://github.com/pilcrowOnPaper) : Rename `SESSION_COOKIE_NAME` to `DEFAULT_SESSION_COOKIE_NAME`

- [#682](https://github.com/pilcrowOnPaper/lucia/pull/682) by [@pilcrowOnPaper](https://github.com/pilcrowOnPaper) : **NPM package `lucia-auth` is renamed to `lucia`**

- [#682](https://github.com/pilcrowOnPaper/lucia/pull/682) by [@pilcrowOnPaper](https://github.com/pilcrowOnPaper) : Update `RequestContext`:

    - Add `RequestContext.headers.authorization`

    - Add optional `RequestContext.storedSessionCookie`

### Minor changes

- [#682](https://github.com/pilcrowOnPaper/lucia/pull/682) by [@pilcrowOnPaper](https://github.com/pilcrowOnPaper) : Support bearer tokens

    - Add `Auth.readBearerToken()`

    - Add `AuthRequest.validateBearerToken()`

- [#682](https://github.com/pilcrowOnPaper/lucia/pull/682) by [@pilcrowOnPaper](https://github.com/pilcrowOnPaper) : New `lucia/utils` export:

    - `generateRandomString()`

    - `serializeCookie()`

    - `isWithinExpiration()`