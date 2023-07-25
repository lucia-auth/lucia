---
package: "@lucia-auth/adapter-mongoose" # package name
type: "minor" # "major", "minor", "patch"
---

Add a getSessionAndUserBySessionId method to adapter-mongoose, using a lookup (join) instead of two separate db calls.