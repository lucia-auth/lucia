## Overview

These can be imported from `lucia-sveltekit/client`.

```ts
import { signOut } from "lucia-sveltekit/client";
```

## Reference

### getSession

Returns a session store.

```ts
const getSession: () => Writable<Session>;
```

### signOut

Signs out a user. Can only be called in a browser context (cannot be called during SSR).

```ts
const signOut: () => Promise<void>;
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
