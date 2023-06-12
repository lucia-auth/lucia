---
package: "lucia" # package name
type: "major" # "major", "minor", "patch"
---

Update adapter specifications
    - Insert and update methods do not return anything
    - Insert and update methods for sessions and keys may optionally throw a Lucia error on invalid user id
    - Insert methods do not throw Lucia errors on duplicate session and user ids