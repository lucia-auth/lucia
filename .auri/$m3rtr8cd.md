---
package: "@lucia-auth/oauth" # package name
type: "patch" # "major", "minor", "patch"
---

Fixes `generatePKCECodeChallenge()` to correctly apply SHA-256 and Base64Url encoding as per PKCE specification.