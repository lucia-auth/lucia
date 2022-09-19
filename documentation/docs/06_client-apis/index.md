## Overview

These can be imported from `lucia-sveltekit/client`.

```ts
import { signOut } from "lucia-sveltekit/client";
```

## Session store

The store returned by `getSession()`. The initial value is equal to `_lucia` inside page data on the initial load, which is set with `handleServerSession()`. However, it's important to note that it is **_not_** dependant on page data _store_, and independent of its value. And as such, updating page data store via load functions using `invalidate` or `invalidateAll` will **not** update the session store. To update the session store after updating cookies (such as on sign in or sign out), the user should be redirected by updating `window.location.href` instead of `invalidateAll()` + `goto()`.

## Reference

### getSession

Returns a session store.

```ts
const getSession: () => Writable<Session>;
```

### signOut

Signs out a user. Can only be called in a browser context (cannot be called during SSR). The user should be redirected by updating `window.location.href` instead of `goto()`.

```ts
const signOut: (
    redirect?: string // if provided, will redirect to the provided location
) => Promise<void>;
```

#### Errors

| name                   | description                           |
| ---------------------- | ------------------------------------- |
| AUTH_NOT_AUTHENTICATED | Session is `null`                     |
| DATABASE_UPDATE_FAILED | Failed to update database             |
| UNKNOWN                | Unknown error, likely a network error |

### refreshTokens

Refreshes refresh and access token.

```ts
const refreshTokens: (
    refreshToken: string
) => Promise<{ refresh_token: string; access_token: string }>;
```

#### Errors

| name                  | description                           |
| --------------------- | ------------------------------------- |
| AUTH_UNAUTHORIZED     | Unauthorized user                     |
| DATABASE_FETCH_FAILED | Failed to get data from database      |
| UNKNOWN               | Unknown error, likely a network error |

### handleSilentRefresh

Automatically refreshes access token when expiration nears (1 min.). Only runs on the browser and not during SSR.

```ts
const handleSilentRefresh: (onError?: (e: LuciaError) => void) => void;
```

#### Error

Possible error.

| name                  | description                           |
| --------------------- | ------------------------------------- |
| AUTH_UNAUTHORIZED     | Unauthorized user                     |
| DATABASE_FETCH_FAILED | Failed to get data from database      |
| UNKNOWN               | Unknown error, likely a network error |
