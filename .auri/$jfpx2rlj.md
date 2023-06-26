---
package: "lucia" # package name
type: "major" # "major", "minor", "patch"
---

Overhaul session renewal
    - Remove `Auth.renewSession()`
    - Add `sessionCookie.expires` configuration