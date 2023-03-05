---
package: "@lucia-auth/oauth" # package name
type: "minor" # "major", "minor", "patch"
---

**Breaking changes!!** Major rewrite of the package.
    - New Discord and Facebook provider
    - Import providers from `@lucia-auth/oauth/providers` (no more default imports)
    - New `provider` API!
    - Email scope is no longer added by default for any providers
    - Reduced `providerUser` size for Patreon provider
    - `OAuthProvider.getAuthorizationUrl` returns a promise and `[URL, string]` (`URL` used to be `string`)