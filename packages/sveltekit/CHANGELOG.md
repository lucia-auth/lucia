# CHANGELOG

## 0.2.0

- [Breaking] Remove `getUser()` for load functions
- [Breaking] `onSessionUpdate()` for `handleSession()` takes a boolean instead of `User`
- [Breaking] `signOut()` no longer clears the local user store
- [Fix] `handleSession()` updates user on load functions page data update and session change across tabs
- `locals.getSession()` and `locals.getUserSession()` will cache the result on initial call and be stored for the duration of the request/page load.

## 0.1.9

- Fix types for `handleHooks()`

## 0.1.8

- Update peer dependency

## 0.1.7

- [Breaking] Removed `locals.clearSession()`
- [Breaking] `signOut()` will throw an error on failed session invalidation
- `locals.setSession()` can be called using `null` to delete all session cookies
- Update `lucia-auth` to v0.1.4

## 0.1.6

- Update package.json

## 0.1.5

- [Breaking] `handleHooks()` no longer validates sessions on request
- [Breaking] `locals.getSession()` validates the session on call (needs to be awaited)
- [Breaking] `handleServerSession()` no longer requires `auth` parameter
- [Fix] Support latest SvelteKit version [#189](https://github.com/pilcrowOnPaper/lucia-auth/issues/189)
- Add `locals.getSessionUser()`

## 0.1.4

- [Breaking] `handleSession()` no longer sync sessions across tabs
- `handleSession()` can take an optional callback that will be called on session change

## 0.1.3

- Resolve issue where `handleSession()` was throwing error on pages without `getUser()` in the load function [#182](https://github.com/pilcrowOnPaper/lucia-auth/issues/182#issuecomment-1296033717)

## 0.1.2

- Update readme and dependencies

## 0.1.1

- Remove `setContext()` dependency
- Fix `handleHooks()` types
