---
package: "lucia-auth" # package name
type: "minor" # "major", "minor", "patch"
---

[Breaking] Rename properties
    - Rename `SingleUseKey.expires` to `SingleUserKey.expiresAt`, `SingleUseKey.isExpired` to `SingleUserKey.expired`,  `SingleUseKey.isPasswordDefined` to `SingleUseKey.passwordDefined`
    - Rename `PersistentKey.isPasswordDefined` to `PersistentKey.passwordDefined`
    - Rename `Session.isFresh` to `Session.fresh`, `Session.idlePeriodExpires` to `Session.idlePeriodExpiresAt`, `Session.activePeriodExpires` to `Session.activePeriodExpiresAt`
    - Rename `Configuration.sessionTimeout` to `Configuration.sessionExpiresIn`
    - Update `Auth.createKey()`