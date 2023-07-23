# lucia

## 2.0.0-beta.7

### Major changes

- [#866](https://github.com/pilcrowOnPaper/lucia/pull/866) by [@pilcrowOnPaper](https://github.com/pilcrowOnPaper) : Rename `cookieName` to `sessionCookieName` in `Middleware`

### Minor changes

- [#864](https://github.com/pilcrowOnPaper/lucia/pull/864) by [@pilcrowOnPaper](https://github.com/pilcrowOnPaper) : Export `generateLuciaPasswordHash`, `validateLuciaPasswordHash` from `/utils`

### Patch changes

- [#849](https://github.com/pilcrowOnPaper/lucia/pull/849) by [@pilcrowOnPaper](https://github.com/pilcrowOnPaper) : Remove Node dependent type check

- [#848](https://github.com/pilcrowOnPaper/lucia/pull/848) by [@pilcrowOnPaper](https://github.com/pilcrowOnPaper) : Normalize string before comparing when validating hashes

## 2.0.0-beta.6

### Major changes

- [#836](https://github.com/pilcrowOnPaper/lucia/pull/836) by [@pilcrowOnPaper](https://github.com/pilcrowOnPaper) : User ids and session ids only consist of lowercase letters and numbers by default

- [#839](https://github.com/pilcrowOnPaper/lucia/pull/839) by [@pilcrowOnPaper](https://github.com/pilcrowOnPaper) : `AuthRequest.validate()` and `Auth.validateBearerToken()` throws database errors

### Minor changes

- [#838](https://github.com/pilcrowOnPaper/lucia/pull/838) by [@pilcrowOnPaper](https://github.com/pilcrowOnPaper) : Add `Auth.transformDatabaseUser()`, `Auth.transformDatabaseKey()`, and `Auth.transformDatabaseSession()`

- [#838](https://github.com/pilcrowOnPaper/lucia/pull/838) by [@pilcrowOnPaper](https://github.com/pilcrowOnPaper) : Export `createKeyId()`

## 2.0.0-beta.5

### Major changes

- [#812](https://github.com/pilcrowOnPaper/lucia/pull/812) by [@pilcrowOnPaper](https://github.com/pilcrowOnPaper) : Remove `allowedRequestOrigins` configuration

### Patch changes

- [#815](https://github.com/pilcrowOnPaper/lucia/pull/815) by [@pilcrowOnPaper](https://github.com/pilcrowOnPaper) : Fix `getSessionAndUser()` adapter method getting called when using session adapters

## 2.0.0-beta.4

### Patch changes

- [#799](https://github.com/pilcrowOnPaper/lucia/pull/799) by [@ernestoresende](https://github.com/ernestoresende) : fix `nextjs` middleware runtime errors on app router

- [#801](https://github.com/pilcrowOnPaper/lucia/pull/801) by [@pilcrowOnPaper](https://github.com/pilcrowOnPaper) : Fix `express()` middleware returning broken request url

## 2.0.0-beta.3

### Major changes

- [#773](https://github.com/pilcrowOnPaper/lucia/pull/773) by [@pilcrowOnPaper](https://github.com/pilcrowOnPaper) : Update `web()` middleware

- [#772](https://github.com/pilcrowOnPaper/lucia/pull/772) by [@pilcrowOnPaper](https://github.com/pilcrowOnPaper) : Update `Auth.createSession()` params

- [#772](https://github.com/pilcrowOnPaper/lucia/pull/772) by [@pilcrowOnPaper](https://github.com/pilcrowOnPaper) : Update `Auth.createKey()` params

- [#773](https://github.com/pilcrowOnPaper/lucia/pull/773) by [@pilcrowOnPaper](https://github.com/pilcrowOnPaper) : Remove `AuthRequest.renewBearerToken()`

- [#773](https://github.com/pilcrowOnPaper/lucia/pull/773) by [@pilcrowOnPaper](https://github.com/pilcrowOnPaper) : Update `nextjs()` middleware

- [#773](https://github.com/pilcrowOnPaper/lucia/pull/773) by [@pilcrowOnPaper](https://github.com/pilcrowOnPaper) : Overhaul session renewal

  - Remove `Auth.renewSession()`

  - Add `sessionCookie.expires` configuration

- [#772](https://github.com/pilcrowOnPaper/lucia/pull/772) by [@pilcrowOnPaper](https://github.com/pilcrowOnPaper) : Remove `generateUserId()` configuration

- [#772](https://github.com/pilcrowOnPaper/lucia/pull/772) by [@pilcrowOnPaper](https://github.com/pilcrowOnPaper) : Add optional `userId` to `Auth.createUser()` params

## 2.0.0-beta.2

### Major changes

- [#739](https://github.com/pilcrowOnPaper/lucia/pull/739) by [@pilcrowOnPaper](https://github.com/pilcrowOnPaper) : `Auth.readSessionCookie()` and `Auth.readBearerToken()` takes the session and authorization header value respectively

- [#754](https://github.com/pilcrowOnPaper/lucia/pull/754) by [@pilcrowOnPaper](https://github.com/pilcrowOnPaper) : `Auth.validateRequestOrigin()` checks for CSRF regardless of `csrfProtection` config

- [#753](https://github.com/pilcrowOnPaper/lucia/pull/753) by [@pilcrowOnPaper](https://github.com/pilcrowOnPaper) : Rename `requestOrigins` config to `allowedRequestOrigins`

### Minor changes

- [#739](https://github.com/pilcrowOnPaper/lucia/pull/739) by [@pilcrowOnPaper](https://github.com/pilcrowOnPaper) : Add `AuthRequest.renewBearerToken()`

- [#752](https://github.com/pilcrowOnPaper/lucia/pull/752) by [@pilcrowOnPaper](https://github.com/pilcrowOnPaper) : Export `parseCookie()` from `/utils`
