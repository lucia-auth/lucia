---
package: "lucia-auth" # package name
type: "minor" # "major", "minor", "patch"
---

**Breaking changes** Better integrate single use keys and clean up APIÏ
    - Update `Key` type
    - Remove `getKeyUser()`
    - Replace `validateKeyPassword()` with `useKey()`
    - Replace `data.key` with `data.primaryKey` for `createUser()`
    - Update `createKey()`
    - `getAllUserKeys()` returns all keys, including those expired