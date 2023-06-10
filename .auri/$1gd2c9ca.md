---
package: "lucia" # package name
type: "major" # "major", "minor", "patch"
---

Update configuration
    - Remove `autoDatabaseCleanup`
    - Remove `transformDatabaseUser()` (see `transformUserAttributes()`)
    - Replace `generateCustomUserId()` with `generateUserId()`
    - Replace `hash` with `passwordHash`
    - Replace `origin` with `requestOrigins`
    - Replace `sessionCookie` with `sessionCookie.attributes`
    - Add `sessionCookie.name` for setting session cookie name
    - Add `transformUserAttributes()` for defining user attributes (**`userId` is automatically included**)
    - Add `transformSessionAttributes()` for defining session attributes 