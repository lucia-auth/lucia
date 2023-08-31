---
package: "lucia" # package name
type: "patch" # "major", "minor", "patch"
---

Fix `AuthRequest.validateBearerToken()` returning `null` when session is idle