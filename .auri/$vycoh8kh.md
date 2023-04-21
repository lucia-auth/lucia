---
package: "lucia-auth" # package name
type: "minor" # "major", "minor", "patch"
---

Update adapter requirements
    - Removed: `UserAdapter.updateUserAttributes()` should validate provided user id
    - `UserAdapter.updateUserAttributes()` may throw `AUTH_INVALID_USER_ID`
    - `UserAdapter.updateUserAttributes()` should return `void` or `UserSchema`
    - Removed: `UserAdapter.updateKeyPassword()` should validate provided key id
    - `UserAdapter.updateKeyPassword()` may throw `AUTH_INVALID_KEY_ID`
    - `UserAdapter.updateKeyPassword()` should return `void` or `KeySchema`
    - UserAdapter: `UserAdapter.getKey()` should delete single use keys with `shouldDataBeDeleted()`
    - `UserAdapter.setUser()` should use transactions or batch queries to store the user and key
