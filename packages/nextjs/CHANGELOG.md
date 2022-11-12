# CHANGELOG

## 0.2.0

- [Breaking] Requires `lucia-auth` v0.2.0

## 0.1.2

- Update peer dependency

## 0.1.1

- [Breaking] Removed `AuthRequest().clearSession()`
- [Breaking] `signOut()` will throw an error on failed session invalidation
- `AuthRequest().setSession()` can be called using `null` to delete all session cookies
- Update `lucia-auth` to v0.1.4