# CHANGELOG

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
