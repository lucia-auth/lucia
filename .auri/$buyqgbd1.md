---
package: "@lucia-auth/adapter-test" # package name
type: "major" # "major", "minor", "patch"
---

Update `testAdapter()` and `testSessionAdapter()`
    - Rename type `QueryHandler` to `LuciaQueryHandler`
    - Remove `testUserAdapter()`
    - Test modules no longer end process by default