---
package: "@lucia-auth/oauth" # package name
type: "patch" # "major", "minor", "patch"
---

Fixes a typo in the `createOAuth2AuthorizationUrl()` and `createOAuth2AuthorizationUrlWithPKCE()` where the `redirect_uri` field was incorrectly set to `redirect_url`.