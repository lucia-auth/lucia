---
package: "lucia" # package name
type: "major" # "major", "minor", "patch"
---

Remove primary keys
    - Remove `Key.primary`
    - Rename `Auth.createUser()` params `options.primaryKey` to `options.key`
    - Remove column `key(primary_key)`