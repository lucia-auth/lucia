# CHANGELOG

## 0.5.1

- Update peer dependency

## 0.5.0

- [Breaking] Require `lucia-auth` 0.5.0

## 0.4.1

- Update peer dependency

## 0.4.0

- [Breaking] Renamed `authRequest.validate()` to `AuthRequest.validate()`, `authRequest.validateUser()` to `AuthRequest.validateUser()`

## 0.3.0

- [Breaking] Requires `lucia-auth` 0.3.0

## 0.2.0

- [Breaking] Requires `lucia-auth` 0.2.0

## 0.1.2

- Update peer dependency

## 0.1.1

- [Breaking] Removed `AuthRequest.clearSession()`
- [Breaking] `signOut()` will throw an error on failed session invalidation
- `AuthRequest().setSession()` can be called using `null` to delete all session cookies
- Update `lucia-auth` to 0.1.4
