---
package: "lucia" # package name
type: "patch" # "major", "minor", "patch"
---

Fix `Auth.useKey()` accepting any password if the key password was set to `null`