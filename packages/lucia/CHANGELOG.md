# lucia

## 3.2.2

### Patch changes

-   Fix cookie expiration.

## 3.2.1

### Patch changes

-   [#1708](https://github.com/lucia-auth/lucia/pull/1708) by [@pilcrowOnPaper](https://github.com/pilcrowOnPaper) : Update dependencies.

## 3.2.0

### Minor changes

-   [#1548](https://github.com/lucia-auth/lucia/pull/1548) by [@pilcrowOnPaper](https://github.com/pilcrowOnPaper) : Add `generateIdFromEntropySize()`

### Patch changes

-   [#1546](https://github.com/lucia-auth/lucia/pull/1546) by [@pilcrowOnPaper](https://github.com/pilcrowOnPaper) : Fix `options.sessionCookie` parameter type in `Lucia`

-   [#1548](https://github.com/lucia-auth/lucia/pull/1548) by [@pilcrowOnPaper](https://github.com/pilcrowOnPaper) : Optimize session ID generation

## 3.1.1

-   Fix types.

## 3.1.0

-   Add option to configure user ID type ([#1472](https://github.com/lucia-auth/lucia/pull/1472)).

## 3.0.1

-   Fix `LegacyScrypt` generating malformed hash (see [#1370](https://github.com/lucia-auth/lucia/pull/1370) - no security concerns)

## 3.0.0

See the [migration guide](https://v3.lucia-auth.com/upgrade-v3).

## 2.7.6

### Patch changes

-   [#1309](https://github.com/lucia-auth/lucia/pull/1309) by [@pilcrowOnPaper](https://github.com/pilcrowOnPaper) : Fix `setCookie()` method in SvelteKit middleware

## 2.7.5

### Patch changes

-   [#1301](https://github.com/lucia-auth/lucia/pull/1301) by [@matteopolak](https://github.com/matteopolak) : Update SvelteKit middleware to be compatible with SvelteKit v2

## 2.7.4

### Patch changes

-   [#1250](https://github.com/lucia-auth/lucia/pull/1250) by [@pilcrowOnPaper](https://github.com/pilcrowOnPaper) : Revert #1158

-   [#1256](https://github.com/lucia-auth/lucia/pull/1256) by [@FredTreg](https://github.com/FredTreg) : Allow debug message to be displayed when request origin not available

-   [#1254](https://github.com/lucia-auth/lucia/pull/1254) by [@pilcrowOnPaper](https://github.com/pilcrowOnPaper) : Remove unused `svelte` field from `package.json`

-   [#1250](https://github.com/lucia-auth/lucia/pull/1250) by [@pilcrowOnPaper](https://github.com/pilcrowOnPaper) : Remove `nanoid` dependency

## 2.7.3

### Patch changes

-   [#1217](https://github.com/lucia-auth/lucia/pull/1217) by [@pilcrowOnPaper](https://github.com/pilcrowOnPaper) : Fix `express()` middleware setting incorrect `Max-Age` cookie attribute

-   [#1158](https://github.com/lucia-auth/lucia/pull/1158) by [@pilcrowOnPaper](https://github.com/pilcrowOnPaper) : Update dependencies

## 2.7.2

### Patch changes

-   [#1212](https://github.com/lucia-auth/lucia/pull/1212) by [@pilcrowOnPaper](https://github.com/pilcrowOnPaper) : Remove dev dependencies for typing

## 2.7.1

### Patch changes

-   [#1171](https://github.com/lucia-auth/lucia/pull/1171) by [@pilcrowOnPaper](https://github.com/pilcrowOnPaper) : Add proper attributes for `@noble/hashes`

## 2.7.0

### Minor changes

-   [#1081](https://github.com/lucia-auth/lucia/pull/1081) by [@SkepticMystic](https://github.com/SkepticMystic) : Add experimental `joinAdapters()`

-   [#1148](https://github.com/lucia-auth/lucia/pull/1148) by [@pilcrowOnPaper](https://github.com/pilcrowOnPaper) : Add `AuthRequest.invalidate()`

### Patch changes

-   [#1134](https://github.com/lucia-auth/lucia/pull/1134) by [@giacomoferretti](https://github.com/giacomoferretti) : Fix unhandled rejection error when using `AuthRequest.validate()` and `AuthRequest.validateBearerToken()`

-   [#1144](https://github.com/lucia-auth/lucia/pull/1144) by [@MrNiceRicee](https://github.com/MrNiceRicee) : Update `elysia()` middleware types

## 2.6.0

### Minor changes

-   [#1113](https://github.com/pilcrowOnPaper/lucia/pull/1113) by [@pilcrowOnPaper](https://github.com/pilcrowOnPaper) : Add `options.responseMode` params to `apple()`

-   [#1100](https://github.com/pilcrowOnPaper/lucia/pull/1100) by [@pilcrowOnPaper](https://github.com/pilcrowOnPaper) : Add `nextjs_future()` middleware

-   [#1099](https://github.com/pilcrowOnPaper/lucia/pull/1099) by [@pilcrowOnPaper](https://github.com/pilcrowOnPaper) : Mark `Auth.validateRequestOrigin()` as deprecated

-   [#1099](https://github.com/pilcrowOnPaper/lucia/pull/1099) by [@pilcrowOnPaper](https://github.com/pilcrowOnPaper) : Replace type `RequestContext` with `MiddlewareRequestContext` for type `Middleware`

### Patch changes

-   [#1105](https://github.com/pilcrowOnPaper/lucia/pull/1105) by [@pilcrowOnPaper](https://github.com/pilcrowOnPaper) : Fix `Auth.useKey()` accepting any password if the key password was set to `null`

-   [#1105](https://github.com/pilcrowOnPaper/lucia/pull/1105) by [@pilcrowOnPaper](https://github.com/pilcrowOnPaper) : Fix `Auth.createUser()` setting key password to `null` if `key.password` was an empty string

## 2.5.0

### Minor changes

-   [#992](https://github.com/pilcrowOnPaper/lucia/pull/992) by [@Tirke](https://github.com/Tirke) : Add `elysia()` middleware

### Patch changes

-   [#1079](https://github.com/pilcrowOnPaper/lucia/pull/1079) by [@pilcrowOnPaper](https://github.com/pilcrowOnPaper) : Fix `Auth.handleRequest()` causing error in middleware when `nextjs()` was used

## 2.4.2

### Patch changes

-   [#1046](https://github.com/pilcrowOnPaper/lucia/pull/1046) by [@pilcrowOnPaper](https://github.com/pilcrowOnPaper) : Fix `AuthRequest.validateBearerToken()` returning `null` when session is idle

## 2.4.1

### Patch changes

-   [#1041](https://github.com/pilcrowOnPaper/lucia/pull/1041) by [@pilcrowOnPaper](https://github.com/pilcrowOnPaper) : Support Astro v3

## 2.4.0

### Minor changes

-   [#986](https://github.com/pilcrowOnPaper/lucia/pull/986) by [@KazuumiN](https://github.com/KazuumiN) : Fixed `updateKeyPassword()` to return a `Promise<Key>`

### Patch changes

-   [#980](https://github.com/pilcrowOnPaper/lucia/pull/980) by [@pilcrowOnPaper](https://github.com/pilcrowOnPaper) : Remove unused and undocumented `csrfProtection.baseDomain` configuration

-   [#985](https://github.com/pilcrowOnPaper/lucia/pull/985) by [@pilcrowOnPaper](https://github.com/pilcrowOnPaper) : Fix Lucia throwing `AUTH_OUTDATED_PASSWORD` when using Bcrypt

## 2.3.0

### Minor changes

-   [#958](https://github.com/pilcrowOnPaper/lucia/pull/958) by [@aust1nz](https://github.com/aust1nz) : Add `fastify()` middleware

## 2.2.0

### Minor changes

-   [#944](https://github.com/pilcrowOnPaper/lucia/pull/944) by [@pilcrowOnPaper](https://github.com/pilcrowOnPaper) : Add `hono()` middleware

## 2.1.0

### Minor changes

-   [#911](https://github.com/pilcrowOnPaper/lucia/pull/911) by [@pilcrowOnPaper](https://github.com/pilcrowOnPaper) : Allow `null` in `csrfProtection.allowedSubdomains` configuration array

## 2.0.0

### Major changes

-   [#884](https://github.com/pilcrowOnPaper/lucia/pull/884) by [@pilcrowOnPaper](https://github.com/pilcrowOnPaper) : Update version

## 2.0.0-beta.7

### Major changes

-   [#866](https://github.com/pilcrowOnPaper/lucia/pull/866) by [@pilcrowOnPaper](https://github.com/pilcrowOnPaper) : Rename `cookieName` to `sessionCookieName` in `Middleware`

### Minor changes

-   [#864](https://github.com/pilcrowOnPaper/lucia/pull/864) by [@pilcrowOnPaper](https://github.com/pilcrowOnPaper) : Export `generateLuciaPasswordHash`, `validateLuciaPasswordHash` from `/utils`

### Patch changes

-   [#849](https://github.com/pilcrowOnPaper/lucia/pull/849) by [@pilcrowOnPaper](https://github.com/pilcrowOnPaper) : Remove Node dependent type check

-   [#848](https://github.com/pilcrowOnPaper/lucia/pull/848) by [@pilcrowOnPaper](https://github.com/pilcrowOnPaper) : Normalize string before comparing when validating hashes

## 2.0.0-beta.6

### Major changes

-   [#836](https://github.com/pilcrowOnPaper/lucia/pull/836) by [@pilcrowOnPaper](https://github.com/pilcrowOnPaper) : User ids and session ids only consist of lowercase letters and numbers by default

-   [#839](https://github.com/pilcrowOnPaper/lucia/pull/839) by [@pilcrowOnPaper](https://github.com/pilcrowOnPaper) : `AuthRequest.validate()` and `Auth.validateBearerToken()` throws database errors

### Minor changes

-   [#838](https://github.com/pilcrowOnPaper/lucia/pull/838) by [@pilcrowOnPaper](https://github.com/pilcrowOnPaper) : Add `Auth.transformDatabaseUser()`, `Auth.transformDatabaseKey()`, and `Auth.transformDatabaseSession()`

-   [#838](https://github.com/pilcrowOnPaper/lucia/pull/838) by [@pilcrowOnPaper](https://github.com/pilcrowOnPaper) : Export `createKeyId()`

## 2.0.0-beta.5

### Major changes

-   [#812](https://github.com/pilcrowOnPaper/lucia/pull/812) by [@pilcrowOnPaper](https://github.com/pilcrowOnPaper) : Remove `allowedRequestOrigins` configuration

### Patch changes

-   [#815](https://github.com/pilcrowOnPaper/lucia/pull/815) by [@pilcrowOnPaper](https://github.com/pilcrowOnPaper) : Fix `getSessionAndUser()` adapter method getting called when using session adapters

## 2.0.0-beta.4

### Patch changes

-   [#799](https://github.com/pilcrowOnPaper/lucia/pull/799) by [@ernestoresende](https://github.com/ernestoresende) : fix `nextjs` middleware runtime errors on app router

-   [#801](https://github.com/pilcrowOnPaper/lucia/pull/801) by [@pilcrowOnPaper](https://github.com/pilcrowOnPaper) : Fix `express()` middleware returning broken request url

## 2.0.0-beta.3

### Major changes

-   [#773](https://github.com/pilcrowOnPaper/lucia/pull/773) by [@pilcrowOnPaper](https://github.com/pilcrowOnPaper) : Update `web()` middleware

-   [#772](https://github.com/pilcrowOnPaper/lucia/pull/772) by [@pilcrowOnPaper](https://github.com/pilcrowOnPaper) : Update `Auth.createSession()` params

-   [#772](https://github.com/pilcrowOnPaper/lucia/pull/772) by [@pilcrowOnPaper](https://github.com/pilcrowOnPaper) : Update `Auth.createKey()` params

-   [#773](https://github.com/pilcrowOnPaper/lucia/pull/773) by [@pilcrowOnPaper](https://github.com/pilcrowOnPaper) : Remove `AuthRequest.renewBearerToken()`

-   [#773](https://github.com/pilcrowOnPaper/lucia/pull/773) by [@pilcrowOnPaper](https://github.com/pilcrowOnPaper) : Update `nextjs()` middleware

-   [#773](https://github.com/pilcrowOnPaper/lucia/pull/773) by [@pilcrowOnPaper](https://github.com/pilcrowOnPaper) : Overhaul session renewal

    -   Remove `Auth.renewSession()`

    -   Add `sessionCookie.expires` configuration

-   [#772](https://github.com/pilcrowOnPaper/lucia/pull/772) by [@pilcrowOnPaper](https://github.com/pilcrowOnPaper) : Remove `generateUserId()` configuration

-   [#772](https://github.com/pilcrowOnPaper/lucia/pull/772) by [@pilcrowOnPaper](https://github.com/pilcrowOnPaper) : Add optional `userId` to `Auth.createUser()` params

## 2.0.0-beta.2

### Major changes

-   [#739](https://github.com/pilcrowOnPaper/lucia/pull/739) by [@pilcrowOnPaper](https://github.com/pilcrowOnPaper) : `Auth.readSessionCookie()` and `Auth.readBearerToken()` takes the session and authorization header value respectively

-   [#754](https://github.com/pilcrowOnPaper/lucia/pull/754) by [@pilcrowOnPaper](https://github.com/pilcrowOnPaper) : `Auth.validateRequestOrigin()` checks for CSRF regardless of `csrfProtection` config

-   [#753](https://github.com/pilcrowOnPaper/lucia/pull/753) by [@pilcrowOnPaper](https://github.com/pilcrowOnPaper) : Rename `requestOrigins` config to `allowedRequestOrigins`

### Minor changes

-   [#739](https://github.com/pilcrowOnPaper/lucia/pull/739) by [@pilcrowOnPaper](https://github.com/pilcrowOnPaper) : Add `AuthRequest.renewBearerToken()`

-   [#752](https://github.com/pilcrowOnPaper/lucia/pull/752) by [@pilcrowOnPaper](https://github.com/pilcrowOnPaper) : Export `parseCookie()` from `/utils`

### 2.0.0-beta.1

#### Patch changes

-   [#735](https://github.com/pilcrowOnPaper/lucia/pull/735) by [@pilcrowOnPaper](https://github.com/pilcrowOnPaper) : Fix `Session.fresh` fixed to `false`

### 2.0.0-beta.0

#### Major changes

-   [#682](https://github.com/pilcrowOnPaper/lucia/pull/682) by [@pilcrowOnPaper](https://github.com/pilcrowOnPaper) : Update configuration

    -   Remove `autoDatabaseCleanup`

    -   Remove `transformDatabaseUser()` (see `transformUserAttributes()`)

    -   Replace `generateCustomUserId()` with `generateUserId()`

    -   Replace `hash` with `passwordHash`

    -   Replace `origin` with `requestOrigins`

    -   Replace `sessionCookie` with `sessionCookie.attributes`

    -   Add `sessionCookie.name` for setting session cookie name

    -   Add `transformUserAttributes()` for defining user attributes (**`userId` is automatically included**)

    -   Add `transformSessionAttributes()` for defining session attributes

-   [#682](https://github.com/pilcrowOnPaper/lucia/pull/682) by [@pilcrowOnPaper](https://github.com/pilcrowOnPaper) : Update `Auth` methods:

    -   Remove `getSessionUser()`

    -   Remove `validateSessionUser()`

    -   Remove `parseRequestHeaders()`

    -   Add `readSessionCookie()`

    -   Add `validateRequestOrigin()`

-   [#682](https://github.com/pilcrowOnPaper/lucia/pull/682) by [@pilcrowOnPaper](https://github.com/pilcrowOnPaper) : Remove primary keys

    -   Remove `Key.primary`

    -   Rename `Auth.createUser()` params `options.primaryKey` to `options.key`

    -   Remove column `key(primary_key)`

-   [#682](https://github.com/pilcrowOnPaper/lucia/pull/682) by [@pilcrowOnPaper](https://github.com/pilcrowOnPaper) : Remove single use keys

    -   **Lucia v2 no longer supports `@lucia-auth/tokens`**

    -   Remove `Session.type`

    -   Update `Auth.createKey()` params

    -   Remove column `key(expires)`

-   [#682](https://github.com/pilcrowOnPaper/lucia/pull/682) by [@pilcrowOnPaper](https://github.com/pilcrowOnPaper) : Update `Session`

    -   Remove `Session.userId`

    -   Add `Session.user`

-   [#682](https://github.com/pilcrowOnPaper/lucia/pull/682) by [@pilcrowOnPaper](https://github.com/pilcrowOnPaper) : Remove `AuthRequest.validateUser()`

-   [#682](https://github.com/pilcrowOnPaper/lucia/pull/682) by [@pilcrowOnPaper](https://github.com/pilcrowOnPaper) : Introduce custom session attributes

    -   Update `Auth.createSession()` params

    -   Update behavior of `Auth.renewSession()` to include attributes of old session to renewed session automatically

-   [#682](https://github.com/pilcrowOnPaper/lucia/pull/682) by [@pilcrowOnPaper](https://github.com/pilcrowOnPaper) : Overhaul adapter API

    -   Remove `UserAdapter.updateUserAttributes()`

    -   Remove `UserAdapter.deleteNonPrimaryKey()`

    -   Remove `UserAdapter.updateKeyPassword()`

    -   Remove `Adapter?.getSessionAndUserBySessionId()`

    -   Update `UserAdapter.setUser()` params

    -   Remove `UserAdapter.getKey()` params `shouldDataBeDeleted()`

    -   Add `UserAdapter.updateUser()`

    -   Add `UserAdapter.deleteKey()`

    -   Add `UserAdapter.updateKey()`

    -   Add `SessionAdapter.updateSession()`

    -   Add `Adapter.getSessionAndUser()`

    -   Rename type `AdapterFunction` to `InitializeAdapter`

-   [#682](https://github.com/pilcrowOnPaper/lucia/pull/682) by [@pilcrowOnPaper](https://github.com/pilcrowOnPaper) : Update adapter specifications

    -   Insert and update methods do not return anything

    -   Insert and update methods for sessions and keys may optionally throw a Lucia error on invalid user id

    -   Insert methods do not throw Lucia errors on duplicate session and user ids

-   [#682](https://github.com/pilcrowOnPaper/lucia/pull/682) by [@pilcrowOnPaper](https://github.com/pilcrowOnPaper) : Remove errors:

    -   `AUTH_DUPLICATE_SESSION_ID`

    -   `AUTO_USER_ID_GENERATION_NOT_SUPPORTED`

    -   `AUTH_EXPIRED_KEY`

-   [#682](https://github.com/pilcrowOnPaper/lucia/pull/682) by [@pilcrowOnPaper](https://github.com/pilcrowOnPaper) : Remove auto database clean up functionality

-   [#682](https://github.com/pilcrowOnPaper/lucia/pull/682) by [@pilcrowOnPaper](https://github.com/pilcrowOnPaper) : Update `Middleware` takes a new `Context` params

-   [#682](https://github.com/pilcrowOnPaper/lucia/pull/682) by [@pilcrowOnPaper](https://github.com/pilcrowOnPaper) : Update exports:

    -   **Replace default export with named `lucia()`**

    -   Removed `generateRandomString()`

    -   Removed `serializeCookie()`

    -   Removed `Cookie`

-   [#682](https://github.com/pilcrowOnPaper/lucia/pull/682) by [@pilcrowOnPaper](https://github.com/pilcrowOnPaper) : Rename `SESSION_COOKIE_NAME` to `DEFAULT_SESSION_COOKIE_NAME`

-   [#682](https://github.com/pilcrowOnPaper/lucia/pull/682) by [@pilcrowOnPaper](https://github.com/pilcrowOnPaper) : **NPM package `lucia-auth` is renamed to `lucia`**

-   [#682](https://github.com/pilcrowOnPaper/lucia/pull/682) by [@pilcrowOnPaper](https://github.com/pilcrowOnPaper) : Update `RequestContext`:

    -   Add `RequestContext.headers.authorization`

    -   Add optional `RequestContext.storedSessionCookie`

#### Minor changes

-   [#682](https://github.com/pilcrowOnPaper/lucia/pull/682) by [@pilcrowOnPaper](https://github.com/pilcrowOnPaper) : Support bearer tokens

    -   Add `Auth.readBearerToken()`

    -   Add `AuthRequest.validateBearerToken()`

-   [#682](https://github.com/pilcrowOnPaper/lucia/pull/682) by [@pilcrowOnPaper](https://github.com/pilcrowOnPaper) : New `lucia/utils` export:

    -   `generateRandomString()`

    -   `serializeCookie()`

    -   `isWithinExpiration()`
