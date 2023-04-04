---
package: "@lucia-auth/adapter-prisma" # package name
type: "patch" # "major", "minor", "patch"
---

Fix issue where all errors from `setUser()` were thrown as `INVALID_KEY_ID` Lucia error