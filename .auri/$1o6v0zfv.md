---
package: "@lucia-auth/oauth" # package name
type: "minor" # "major", "minor", "patch"
---

Add experimental OAuth helpers: 
    - `createOAuth2AuthorizationUrl()`
    - `createOAuth2AuthorizationUrlWithPKCE()`
    - `validateOAuth2AuthorizationCode()`
    - `decodeIdToken()`
    - `IdTokenError`