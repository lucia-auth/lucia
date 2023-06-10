---
package: "lucia" # package name
type: "major" # "major", "minor", "patch"
---

Remove single use keys
    - **Lucia v2 no longer supports `@lucia-auth/tokens`**
    - Remove `Session.type`
    - Update `Auth.createKey()` params
    - Remove column `key(expires)`