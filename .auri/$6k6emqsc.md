---
package: "lucia-auth" # package name
type: "minor" # "major", "minor", "patch"
---

Introduce middleware
    - [Breaking] Rename `Auth.validateRequestHeaders()` to `Auth.parseRequestHeaders()`
    - [Breaking] Replace `Auth.createSessionCookies()` with `Auth.createSessionCookie()`
    - [Breaking] `Configuration.sessionCookie` expects an object
    - Add `origin` config