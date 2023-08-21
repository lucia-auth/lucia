---
package: "@lucia-auth/oauth" # package name
type: "patch" # "major", "minor", "patch"
---

Fix `createOAuth2AuthorizationUrl()` and `createOAuth2AuthorizationUrlWithPKCE()` always returning a new state