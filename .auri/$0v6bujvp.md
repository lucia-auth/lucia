---
package: "@lucia-auth/oauth" # package name
type: "patch" # "major", "minor", "patch"
---

Fix `createOAuth2AuthorizationUrl()` and `createOAuth2AuthorizationUrlWithPKCE()` incorrectly setting `redirect_uri` field to `redirect_url`.