---
package: "lucia" # package name
type: "major" # "major", "minor", "patch"
---

Update `Auth` methods:
    - Remove `getSessionUser()`
    - Remove `validateSessionUser()`
    - Remove `parseRequestHeaders()`
    - Add `readSessionCookie()`
    - Add `validateRequestOrigin()`