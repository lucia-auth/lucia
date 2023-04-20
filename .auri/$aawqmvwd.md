---
package: "@lucia-auth/adapter-mongoose" # package name
type: "patch" # "major", "minor", "patch"
---

Fix bugs
    - Fix `Adapter.deleteNonPrimaryKey()` deleting non-primary keys
    - Fix `Adapter.updateUserAttributes()` returning old data