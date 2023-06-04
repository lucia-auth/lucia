# @lucia-auth/oauth

## 1.1.1

### Patch changes

- [#672](https://github.com/pilcrowOnPaper/lucia/pull/672) by [@pilcrowOnPaper](https://github.com/pilcrowOnPaper) : Fix `LuciaOAuthRequestError`

## 1.1.0

### Minor changes

- [#628](https://github.com/pilcrowOnPaper/lucia/pull/628) by [@pilcrowOnPaper](https://github.com/pilcrowOnPaper) : Also adds the option to pass a default `redirectUri` to the github provider config.

- [#628](https://github.com/pilcrowOnPaper/lucia/pull/628) by [@pilcrowOnPaper](https://github.com/pilcrowOnPaper) : Update OAuth Provider type to allow for a custom `redirectUri` to be passed to `getAuthorizationUrl` and update all providers accordingly.

### Patch changes

- [#626](https://github.com/pilcrowOnPaper/lucia/pull/626) by [@pilcrowOnPaper](https://github.com/pilcrowOnPaper) : `providerUser` respects scope and update `DiscordUser`

## 1.0.1

### Patch changes

- [#550](https://github.com/pilcrowOnPaper/lucia/pull/550) by [@pkb-pmj](https://github.com/pkb-pmj) : Fix OAuth provider types

  - Take `Auth` as a generic for every provider

## 1.0.0

### Major changes

- [#443](https://github.com/pilcrowOnPaper/lucia/pull/443) by [@pilcrowOnPaper](https://github.com/pilcrowOnPaper) : Release version 1.0!

## 0.8.1

### Patch changes

- [#450](https://github.com/pilcrowOnPaper/lucia/pull/450) by [@pilcrowOnPaper](https://github.com/pilcrowOnPaper) : Fix Twitch provider

## 0.8.0

### Minor changes

- [#430](https://github.com/pilcrowOnPaper/lucia/pull/430) by [@pilcrowOnPaper](https://github.com/pilcrowOnPaper) : [Breaking] Rename `LinkedInTokens.expiresIn` to `LinkedInUser.accessTokenExpiresIn`

### Patch changes

- [#430](https://github.com/pilcrowOnPaper/lucia/pull/430) by [@pilcrowOnPaper](https://github.com/pilcrowOnPaper) : Fix types

- [#430](https://github.com/pilcrowOnPaper/lucia/pull/430) by [@pilcrowOnPaper](https://github.com/pilcrowOnPaper) : Update providers

  - Add `GithubTokens.refresh_token`, `GithubTokens.refresh_token_expires_in`, `expires_in`

  - Add `https://www.googleapis.com/auth/userinfo.profile` scope to Google provider by default

## 0.7.3

### Patch changes

- [#431](https://github.com/pilcrowOnPaper/lucia/pull/431) by [@Jings](https://github.com/Jings) : missing facebook oauth index export

## 0.7.2

### Patch changes

- [#424](https://github.com/pilcrowOnPaper/lucia/pull/424) by [@pilcrowOnPaper](https://github.com/pilcrowOnPaper) : - Update dependencies

## 0.7.1

### Patch changes

- [#411](https://github.com/pilcrowOnPaper/lucia/pull/411) by [@Jings](https://github.com/Jings) : Add Auth0 as an oauth provider

## 0.7.0

### Minor changes

- [#398](https://github.com/pilcrowOnPaper/lucia/pull/398) by [@pilcrowOnPaper](https://github.com/pilcrowOnPaper) : **Breaking** Use `lucia-auth@0.9.0`

  - Replaced `createKey()` with `createPersistentKey()`

## 0.6.4

### Patch changes

- [#401](https://github.com/pilcrowOnPaper/lucia/pull/401) by [@Jings](https://github.com/Jings) : Added linkedin as an oauth provider

## 0.6.3

### Patch changes

- [#391](https://github.com/pilcrowOnPaper/lucia/pull/391) by [@BenocxX](https://github.com/BenocxX) : Fix the default scope for the Discord provider

## 0.6.2

### Patch changes

- [#392](https://github.com/pilcrowOnPaper/lucia/pull/392) by [@pilcrowOnPaper](https://github.com/pilcrowOnPaper) : Update peer dependency

## 0.6.1

### Patch changes

- [#388](https://github.com/pilcrowOnPaper/lucia/pull/388) by [@pilcrowOnPaper](https://github.com/pilcrowOnPaper) : remove unnecessary code

## 0.6.0

### Minor changes

- [#385](https://github.com/pilcrowOnPaper/lucia/pull/385) by [@pilcrowOnPaper](https://github.com/pilcrowOnPaper) : **Breaking changes!!** Major rewrite of the package.

  - New Discord and Facebook provider

  - Import providers from `@lucia-auth/oauth/providers` (no more default imports)

  - New `provider` API!

  - Email scope is no longer added by default for any providers

  - Reduced `providerUser` size for Patreon provider

  - `OAuthProvider.getAuthorizationUrl` returns a promise and `[URL, string]` (`URL` used to be `string`)

## 0.5.4

### Patch changes

- [#381](https://github.com/pilcrowOnPaper/lucia/pull/381) by [@pilcrowOnPaper](https://github.com/pilcrowOnPaper) : Update links in README and package.json

## 0.5.3

- Update peer dependency

## 0.5.2

- Update peer dependency

## 0.5.1

- Add `expiresIn`, `refreshToken` to `validateCallback` (Twitch)

## 0.5.0

- [Breaking] Require `lucia-auth` 0.5.0

- [Breaking] Update `createUser` parameter

- `createKey` method in `validateCallback` result

## 0.4.0

- [Breaking] Require `lucia-auth` 0.4.3

- Log request errors on dev mode

## 0.3.2

- [Fix] Fix runtime errors

## 0.3.1

- Add `User-Agent` header to all requests

## 0.3.0

- [Breaking] Rename type `GetUserType` to `LuciaUser`; remove `GetCreateUserAttributesType`

- `userAttributes` params for `createUser` is optional if `Lucia.UserAttributes` is empty

- Make `Buffer` dependency optional

## 0.2.7

- Fix type issues with `existingUser` and `createUser` for `validateCallback`

## 0.2.6

- Update peer dependency

## 0.2.5

- Add Reddit provider

## 0.2.4

- Update peer dependency

## 0.2.3

- Add Patreon provider

## 0.2.2

- Update dependency

## 0.2.1

- Remove crypto dependency [#236](https://github.com/pilcrowOnPaper/lucia/issues/236)

## 0.2.0

- [Breaking] `getAuthorizationUrl` generates and adds `state` params to the authorization url

- [Breaking] `getAuthorizationUrl` returns a tuple

## 0.1.4

- Add Twitch provider

## 0.1.3

- Add support for `lucia-auth` 0.2.x

## 0.1.2

- Fix imports

## 0.1.1

- Update peer dependency
