---
package: "lucia" # package name
type: "major" # "major", "minor", "patch"
---

Overhaul adapter API
    - Remove `UserAdapter.updateUserAttributes()`
    - Remove `UserAdapter.deleteNonPrimaryKey()`
    - Remove `UserAdapter.updateKeyPassword()`
    - Remove `Adapter?.getSessionAndUserBySessionId()`
    - Update `UserAdapter.setUser()` params
    - Remove `UserAdapter.getKey()` params `shouldDataBeDeleted()`
    - Add `UserAdapter.updateUser()`
    - Add `UserAdapter.deleteKey()`
    - Add `UserAdapter.updateKey()`
    - Add `SessionAdapter.updateSession()`
    - Add `Adapter.getSessionAndUser()`
    - Rename type `AdapterFunction` to `InitializeAdapter`