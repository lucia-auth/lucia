# lucia-auth

## 0.8.0

### Minor changes

- [#392](https://github.com/pilcrowOnPaper/lucia/pull/392) by [@pilcrowOnPaper](https://github.com/pilcrowOnPaper) : [Breaking] Rename type `Configurations` to `Configuration`
  [Breaking] Attempting to use an expired key throws `AUTH_EXPIRED_KEY`

## 0.7.3

### Patch changes

- [#388](https://github.com/pilcrowOnPaper/lucia/pull/388) by [@pilcrowOnPaper](https://github.com/pilcrowOnPaper) : remove unnecessary code

## 0.7.2

### Patch changes

- [#381](https://github.com/pilcrowOnPaper/lucia/pull/381) by [@pilcrowOnPaper](https://github.com/pilcrowOnPaper) : Update links in README and package.json

## 0.7.1

- [Fix] update parameters for `createKey`, `createUser`

## 0.7.0

- [Feat] One time keys

- [Breaking] Update `KeySchema`, `UserAdapter`

- [Fix] `getAllUserSessions` only returns active or idle sessions

- Update type `Key`

## 0.6.2

- [Fix] Allow character `:` in provider user id

## 0.6.1

- [Fix] `validateKeyPassword` types

## 0.6.0

- [Breaking] Update `UserAdapter`

- [Breaking] Rename `AUTH_INVALID_KEY` to `AUTH_INVALID_KEY_ID`, `AUTH_DUPLICATE_KEY` to `AUTH_DUPLICATE_KEY_ID`

- [Breaking] `configuration.generateCustomUserId` must return a `string`

- [Fix] `createUser` checks for key id validity before user creation

## 0.5.0

- [Feat] Add keys

- [Breaking] Remove: `getUserByProviderId`, `updateUserProviderId`, `authenticateUser`, `updateUserPassword`

- [Breaking] Change parameters for `createUser`

- [Breaking] Remove error message: `AUTH_INVALID_PROVIDER_ID`, `AUTH_DUPLICATE_PROVIDER_ID`

- [Breaking] Remove `/adapter`

- [Breaking] Rename `session` table column `expires` to `active_expires`

- [Breaking] Lucia will generate its own user id by default (15 chars long)

- [Breaking] Update type `UserAdapter` and `Adapter`

- Allow `config.generateCustomUserId` to be synchronous

## 0.4.3

- Expose type `ENV`

## 0.4.2

- Type `UserSchema` includes any key/values

- Allow type `bigint` for `idle_expires`, `expires` in type `SessionSchema`

## 0.4.1

- `options` parameter for `createUser` is only necessary if `Lucia.UserAttributes` has keys

- `options.attributes` parameter for `createUser` is only required if `Lucia.UserAttributes` has keys

## 0.4.0

- [Breaking] Adapters are now functions that return the `Adapter` object

- Export type `LuciaErrorConstructor`, `AdapterFunction`

## 0.3.4

- Add `AUTO_USER_ID_GENERATION_NOT_SUPPORTED` error

## 0.3.3

- [Fix] Get proper types for `User`

## 0.3.2

- Export `Configurations` type

## 0.3.1

- [Fix] Return type for `lucia`

## 0.3.0

- [Breaking] `getSession` returns both active and idle sessions

- [Breaking] `Session.expires`, `Session.idlePeriodExpires` are `Date` objects

- [Breaking] `renewSession`, `validateSession`, `validateSessionUser` no longer sets session cookie using the provided function parameter

- [Breaking] Rename `Cookie.options` to `Cookie.attributes`

- [Breaking] Rename `Session.expires` to `Session.activePeriodExpires`

- [Breaking] Rename `Config.sessionTimeout` to `Config.sessionTimeout.activePeriod`, `Config.idlePeriodTimeout` to `Config.sessionTimeout.idlePeriod`

- [Breaking] Remove `Config.deleteCookieOption`

- [Breaking] Rename `Config.sessionCookieOption` to `Config.sessionCookie`

- `getSession`, `getSessionUser`, `renewSession`, `validateSessionUser`, `validateSession` deletes the target session from the database if dead by default

- `updateUserProviderId`, `updateUserAttributes`, `createSession` deletes the target user's dead sessions from the database by default

- Add `state`, `isFresh` property to `Session`

- Add `autoDatabaseCleanup` config

## 0.2.2

- [Fix] Ignore `getSessionAndUserBySessionId` if a normal adapter is provided as a user or session adapter

## 0.2.1

- Remove node dependencies (`crypto`, `util`) [#236](https://github.com/pilcrowOnPaper/lucia/issues/236)

- Adds `@noble/hashes` as dependency

- Use block size (`r`) of `16` for hashing passwords with scrypt

- Add `configs.hash.generate` and `configs.hash.validate` for custom hashing implementation

- Normalize password string on hashing

## 0.2.0

- [Breaking] Remove `validateRequest` and `getSessionUserFromRequest`

- [Breaking] Replace `parseRequest` with `validateRequestHeaders`

- [Breaking] `renewSession` requires `setSessionCookie` param and sets cookies

- [Breaking] `validateSession` renews idle sessions

- [Breaking] `getSessionUser` no longers renews idle sessions

- Add `validateSessionUser`, `getSession`, `getSessionUser`, `SESSION_COOKIE_NAME`

## 0.1.4

- [Breaking] Params for `setCookie` params for `validateRequest` and `getSessionUserFromRequest` is now `Session | null` instead of a `string`

- [Breaking] `createSessionCookies`^ returns an array of `Cookie`

- [Breaking] Remove `createBlankSessionCookies`

## 0.1.3

- Export `Lucia.Auth` and `Lucia.UserAttributes`

- Remove `cookie` and `cli-color` dependency

## 0.1.2

- [Breaking] `validateRequest` requires `setCookie` parameter

- Add `getSessionUserFromRequest`

## 0.1.1

- Make input type of request for `parseRequest` and `validateRequest` as minimal as possible
