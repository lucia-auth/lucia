---
package: "@lucia-auth/adapter-mongoose" # package name
type: "minor" # "major", "minor", "patch"
---

Add a `getSessionAndUserBySessionId` method to `mongoose()` adapter, using a lookup (join) instead of two separate db calls.