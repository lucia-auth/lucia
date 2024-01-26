# @lucia-auth/oauth

## 3.5.3

### Patch changes

- [#1353](https://github.com/lucia-auth/lucia/pull/1353) by [@xyassini](https://github.com/xyassini) : Fixed the endpoint used for exchanging authorization codes for the Atlassian provider

## 3.5.2

### Patch changes

- [#1337](https://github.com/lucia-auth/lucia/pull/1337) by [@AmruthPillai](https://github.com/AmruthPillai) : Update Keycloak provider to accept domain argument with protocol

## 3.5.1

### Patch changes

- [#1323](https://github.com/lucia-auth/lucia/pull/1323) by [@NuttyShrimp](https://github.com/NuttyShrimp) : Fix Dropbox provider

## 3.5.0

### Minor changes

- [#1165](https://github.com/lucia-auth/lucia/pull/1165) by [@Ed1ks](https://github.com/Ed1ks) : Adds Keycloak Provider

- [#1207](https://github.com/lucia-auth/lucia/pull/1207) by [@sjunepark](https://github.com/sjunepark) : Add Kakao provider

## 3.4.0

### Minor changes

- [#1230](https://github.com/lucia-auth/lucia/pull/1230) by [@andr35](https://github.com/andr35) : Add `serverUrl` param to `GitlabAuth` config

## 3.3.2

### Patch changes

- [#1226](https://github.com/lucia-auth/lucia/pull/1226) by [@nlfmt](https://github.com/nlfmt) : Fix `DiscordUser`

## 3.3.1

### Patch changes

- [#1179](https://github.com/lucia-auth/lucia/pull/1179) by [@pilcrowOnPaper](https://github.com/pilcrowOnPaper) : Update params `appDomain` for `auth0()`

## 3.3.0

### Minor changes

- [#1147](https://github.com/lucia-auth/lucia/pull/1147) by [@ollema](https://github.com/ollema) : Fix `slack()` provider

### Patch changes

- [#1141](https://github.com/lucia-auth/lucia/pull/1141) by [@q1b](https://github.com/q1b) : Fix `config.accessType` in `google()` provider

- [#1132](https://github.com/lucia-auth/lucia/pull/1132) by [@KazuumiN](https://github.com/KazuumiN) : Fix link at `getLineUser()`

## 3.2.0

### Minor changes

- [#1098](https://github.com/pilcrowOnPaper/lucia/pull/1098) by [@OmerSabic](https://github.com/OmerSabic) : Update `AppleUser`

- [#1098](https://github.com/pilcrowOnPaper/lucia/pull/1098) by [@OmerSabic](https://github.com/OmerSabic) : Add `scope` params to `apple()`

### Patch changes

- [#1106](https://github.com/pilcrowOnPaper/lucia/pull/1106) by [@pilcrowOnPaper](https://github.com/pilcrowOnPaper) : Fix `linkedin()` provider missing default `openid` scope

- [#1105](https://github.com/pilcrowOnPaper/lucia/pull/1105) by [@pilcrowOnPaper](https://github.com/pilcrowOnPaper) : Remove unused `identityProvider` params from `CognitoAuth.getAuthorizationUrl()`

## 3.1.0

### Minor changes

- [#988](https://github.com/pilcrowOnPaper/lucia/pull/988) by [@tmadge](https://github.com/tmadge) : Add AWS Cognito provider

- [#1072](https://github.com/pilcrowOnPaper/lucia/pull/1072) by [@infovore](https://github.com/infovore) : Add Strava provider

- [#1068](https://github.com/pilcrowOnPaper/lucia/pull/1068) by [@pilcrowOnPaper](https://github.com/pilcrowOnPaper) : Add `email` field `FacebookUser`

### Patch changes

- [#1070](https://github.com/pilcrowOnPaper/lucia/pull/1070) by [@pilcrowOnPaper](https://github.com/pilcrowOnPaper) : Update `Auth0User`

- [#1065](https://github.com/pilcrowOnPaper/lucia/pull/1065) by [@pilcrowOnPaper](https://github.com/pilcrowOnPaper) : Remove test files from release

## 3.0.0

### Major changes

- [#993](https://github.com/pilcrowOnPaper/lucia/pull/993) by [@pilcrowOnPaper](https://github.com/pilcrowOnPaper) : Remove `generateState()` export

- [#993](https://github.com/pilcrowOnPaper/lucia/pull/993) by [@pilcrowOnPaper](https://github.com/pilcrowOnPaper) : Replace `OAuthProvider` with `OAuth2ProviderAuth` and `OAuth2ProviderAuthWithPKCE`

- [#993](https://github.com/pilcrowOnPaper/lucia/pull/993) by [@pilcrowOnPaper](https://github.com/pilcrowOnPaper) : Replace `GithubProvider` with `GithubAuth` etc

- [#1022](https://github.com/pilcrowOnPaper/lucia/pull/1022) by [@pilcrowOnPaper](https://github.com/pilcrowOnPaper) : Rename `linkedin()`, type `LinkedinUser`, and type `LinkedinTokens` to `linkedIn()`, `LinkedInUser`, and `LinkedInTokens`

- [#1024](https://github.com/pilcrowOnPaper/lucia/pull/1024) by [@pilcrowOnPaper](https://github.com/pilcrowOnPaper) : Update `auth0()`, `patreon()`, `reddit()`, `spotify()`, `twitch()` params

### Minor changes

- [#1011](https://github.com/pilcrowOnPaper/lucia/pull/1011) by [@pilcrowOnPaper](https://github.com/pilcrowOnPaper) : Add Salesforce provider

- [#993](https://github.com/pilcrowOnPaper/lucia/pull/993) by [@pilcrowOnPaper](https://github.com/pilcrowOnPaper) : Experimental API `createOAuth2AuthorizationUrl()`, `createOAuth2AuthorizationUrlWithPKCE()`, `validateOAuth2AuthorizationCode()`, and `decodeIdToken()` are now stable

- [#993](https://github.com/pilcrowOnPaper/lucia/pull/993) by [@pilcrowOnPaper](https://github.com/pilcrowOnPaper) : Update `createOAuth2AuthorizationUrlWithPKCE()` return type

- [#1016](https://github.com/pilcrowOnPaper/lucia/pull/1016) by [@pilcrowOnPaper](https://github.com/pilcrowOnPaper) : Add Box provider

- [#1005](https://github.com/pilcrowOnPaper/lucia/pull/1005) by [@pilcrowOnPaper](https://github.com/pilcrowOnPaper) : Add Azure Active Directory provider

- [#1012](https://github.com/pilcrowOnPaper/lucia/pull/1012) by [@pilcrowOnPaper](https://github.com/pilcrowOnPaper) : Add Atlassian provider

- [#1015](https://github.com/pilcrowOnPaper/lucia/pull/1015) by [@pilcrowOnPaper](https://github.com/pilcrowOnPaper) : Add Line provider

- [#1013](https://github.com/pilcrowOnPaper/lucia/pull/1013) by [@pilcrowOnPaper](https://github.com/pilcrowOnPaper) : Add GitLab provider

- [#1017](https://github.com/pilcrowOnPaper/lucia/pull/1017) by [@pilcrowOnPaper](https://github.com/pilcrowOnPaper) : Add Bitbucket provider

- [#993](https://github.com/pilcrowOnPaper/lucia/pull/993) by [@pilcrowOnPaper](https://github.com/pilcrowOnPaper) : Remove `options.searchParams` and `options.state` from `createOAuth2AuthorizationUrl()` and `createOAuth2AuthorizationUrlWithPKCE()` params

- [#1011](https://github.com/pilcrowOnPaper/lucia/pull/1011) by [@pilcrowOnPaper](https://github.com/pilcrowOnPaper) : Add Slack provider

### Patch changes

- [#1024](https://github.com/pilcrowOnPaper/lucia/pull/1024) by [@pilcrowOnPaper](https://github.com/pilcrowOnPaper) : Add `global_name` and `avatar_decoration` fields in `DiscordUser` type

- [#1023](https://github.com/pilcrowOnPaper/lucia/pull/1023) by [@pilcrowOnPaper](https://github.com/pilcrowOnPaper) : Fix `validateOAuth2AuthorizationCode()` sending malformed basic auth headers

## 2.2.0

### Minor changes

- [#990](https://github.com/pilcrowOnPaper/lucia/pull/990) by [@pilcrowOnPaper](https://github.com/pilcrowOnPaper) : Add `twitter()` provider (OAuth 2.0 with PKCE)

- [#983](https://github.com/pilcrowOnPaper/lucia/pull/983) by [@pilcrowOnPaper](https://github.com/pilcrowOnPaper) : `decodeIdToken()` throws `SyntaxError`

  - Remove `IdTokenError`

### Patch changes

- [#990](https://github.com/pilcrowOnPaper/lucia/pull/990) by [@pilcrowOnPaper](https://github.com/pilcrowOnPaper) : Fix `GithubUserAuth.githubTokens` not including refresh token

- [#973](https://github.com/pilcrowOnPaper/lucia/pull/973) by [@anhtuank7c](https://github.com/anhtuank7c) : Fix `linkedin()` to use latest LinkedIn OAuth implementation

## 2.1.2

### Patch changes

- [#968](https://github.com/pilcrowOnPaper/lucia/pull/968) by [@KazuumiN](https://github.com/KazuumiN) : Fixes `generatePKCECodeChallenge()` to correctly apply SHA-256 and Base64Url encoding as per PKCE specification.

## 2.1.1

### Patch changes

- [#948](https://github.com/pilcrowOnPaper/lucia/pull/948) by [@pilcrowOnPaper](https://github.com/pilcrowOnPaper) : Fix `createOAuth2AuthorizationUrl()` and `createOAuth2AuthorizationUrlWithPKCE()` incorrectly setting `redirect_uri` field to `redirect_url`.

## 2.1.0

### Minor changes

- [#910](https://github.com/pilcrowOnPaper/lucia/pull/910) by [@pilcrowOnPaper](https://github.com/pilcrowOnPaper) : Add experimental OAuth helpers:

  - `createOAuth2AuthorizationUrl()`

  - `createOAuth2AuthorizationUrlWithPKCE()`

  - `validateOAuth2AuthorizationCode()`

  - `decodeIdToken()`

  - `IdTokenError`

- [#657](https://github.com/pilcrowOnPaper/lucia/pull/657) by [@luccasr73](https://github.com/luccasr73) : Add Apple provider

## 2.0.1

### Patch changes

- [#894](https://github.com/pilcrowOnPaper/lucia/pull/894) by [@pilcrowOnPaper](https://github.com/pilcrowOnPaper) : Fix type `GoogleUser`

## 2.0.0

### Major changes

- [#885](https://github.com/pilcrowOnPaper/lucia/pull/885) by [@pilcrowOnPaper](https://github.com/pilcrowOnPaper) : Update version and peer dependency

### Minor changes

- [#869](https://github.com/pilcrowOnPaper/lucia/pull/869) by [@bachiitter](https://github.com/bachiitter) : Add Google OAuth Access type

## 2.0.0-beta.8

### Minor changes

- [#867](https://github.com/pilcrowOnPaper/lucia/pull/867) by [@pilcrowOnPaper](https://github.com/pilcrowOnPaper) : Update peer dependency

## 2.0.0-beta.7

### Minor changes

- [#843](https://github.com/pilcrowOnPaper/lucia/pull/843) by [@pilcrowOnPaper](https://github.com/pilcrowOnPaper) : Update peer dependency

## 2.0.0-beta.6

### Minor changes

- [#814](https://github.com/pilcrowOnPaper/lucia/pull/814) by [@L-Mario564](https://github.com/L-Mario564) : Add osu! OAuth provider

- [#812](https://github.com/pilcrowOnPaper/lucia/pull/812) by [@pilcrowOnPaper](https://github.com/pilcrowOnPaper) : Update peer dependency

## 2.0.0-beta.5

### Patch changes

- [#803](https://github.com/pilcrowOnPaper/lucia/pull/803) by [@pilcrowOnPaper](https://github.com/pilcrowOnPaper) : Update peer dependency

## 2.0.0-beta.4

### Major changes

- [#788](https://github.com/pilcrowOnPaper/lucia/pull/790) by [@pilcrowOnPaper](https://github.com/pilcrowOnPaper) : Require `lucia@2.0.0-beta.3`

- [#772](https://github.com/pilcrowOnPaper/lucia/pull/772) by [@pilcrowOnPaper](https://github.com/pilcrowOnPaper) : Update `ProviderUserAuth.createUser()` params

## 2.0.0-beta.3

### Major changes

- [#776](https://github.com/pilcrowOnPaper/lucia/pull/776) by [@pilcrowOnPaper](https://github.com/pilcrowOnPaper) : Rename `providerUser` property to `<provider_name>User` (`githubUser` etc)

- [#776](https://github.com/pilcrowOnPaper/lucia/pull/776) by [@pilcrowOnPaper](https://github.com/pilcrowOnPaper) : Rename `useAuth()` to `providerUserAuth()`

- [#776](https://github.com/pilcrowOnPaper/lucia/pull/776) by [@pilcrowOnPaper](https://github.com/pilcrowOnPaper) : Rename `tokens` property to `<provider_name>Tokens` (`githubTokens` etc)

### Minor changes

- [#603](https://github.com/pilcrowOnPaper/lucia/pull/603) by [@msonnberger](https://github.com/msonnberger) : Add Spotify OAuth provider

- [#542](https://github.com/pilcrowOnPaper/lucia/pull/542) by [@gtim](https://github.com/gtim) : Add Lichess OAuth provider

### Patch changes

- [#734](https://github.com/pilcrowOnPaper/lucia/pull/734) by [@KarolusD](https://github.com/KarolusD) : Fix `FacebookUser` type

## 2.0.0-beta.2

### Patch changes

- [#768](https://github.com/pilcrowOnPaper/lucia/pull/768) by [@pilcrowOnPaper](https://github.com/pilcrowOnPaper) : Update peer dependency

## 2.0.0-beta.1

### Major changes

- [#759](https://github.com/pilcrowOnPaper/lucia/pull/759) by [@pilcrowOnPaper](https://github.com/pilcrowOnPaper) : Replace `LuciaOAuthRequestError` with `OAuthRequestError`

### Patch changes

- [#756](https://github.com/pilcrowOnPaper/lucia/pull/756) by [@pilcrowOnPaper](https://github.com/pilcrowOnPaper) : Fix peer dependency version

## 2.0.0-beta.0

### Major changes

- [#682](https://github.com/pilcrowOnPaper/lucia/pull/682) by [@pilcrowOnPaper](https://github.com/pilcrowOnPaper) : Remove `redirectUri` from `getAuthorizationUrl()`

### Minor changes

- [#682](https://github.com/pilcrowOnPaper/lucia/pull/682) by [@pilcrowOnPaper](https://github.com/pilcrowOnPaper) : Require `lucia@^2.0.0`

  - Export `useAuth()`

  - Remove `provider()`

## 1.2.1

### Minor changes

- [#666](https://github.com/pilcrowOnPaper/lucia/pull/666) by [@bachiitter](https://github.com/bachiitter) : Add Google OAuth Access type

### Patch changes

- [#694](https://github.com/pilcrowOnPaper/lucia/pull/694) by [@pilcrowOnPaper](https://github.com/pilcrowOnPaper) : Fix `GithubUser` type

- [#694](https://github.com/pilcrowOnPaper/lucia/pull/694) by [@pilcrowOnPaper](https://github.com/pilcrowOnPaper) : Fix `GoogleUser` type

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
