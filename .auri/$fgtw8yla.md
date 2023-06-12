---
package: "lucia" # package name
type: "major" # "major", "minor", "patch"
---

Introduce custom session attributes
    - Update `Auth.createSession()` params
    - Update behavior of `Auth.renewSession()` to include attributes of old session to renewed session automatically