## Overview

These can be imported from `lucia-sveltekit/client`.

```ts
import { signOut } from "lucia-sveltekit/client";
```

## Reference

### getSession

Retrieves the current session.

```ts
const getSession = () => Writable<ClientSession | null>;
```

#### Returns

| name | type                            | description                                                   |
| ---- | ------------------------------- | ------------------------------------------------------------- |
|      | Writable<ClientSession \| null> | A writable store with [`UserSession`](/references/types#clientsession) or `null` if unauthorized |

### signOut

Signs out a user.

```ts
const signOut: () => Promise<void>;
```

#### Errors

| name                   | description                           |
| ---------------------- | ------------------------------------- |
| AUTH_UNAUTHORIZED      | Unauthorized user                     |
| DATABASE_UPDATE_FAILED | Failed to update database             |
| UKNOWN                 | Unknown error, likely a network error |

### refreshTokens

Refreshes refresh and access token.

```ts
const refreshTokens: (
    refreshToken: string
) => Promise<{ refresh_token: string; access_token: string }>;
```

#### Parameters

| name         | type   | description |
| ------------ | ------ | ----------- |
| refreshToken | string |             |

#### Returns

| name          | type   | description         |
| ------------- | ------ | ------------------- |
| access_token  | string | A new access token  |
| refresh_token | string | A new refresh token |

#### Errors

| name                  | description                           |
| --------------------- | ------------------------------------- |
| AUTH_UNAUTHORIZED     | Unauthorized user                     |
| DATABASE_FETCH_FAILED | Failed to get data from database      |
| UNKNOWN               | Unknown error, likely a network error |

### Lucia (Component)

Handles token refresh. Should be used inside layouts.

```ts
import { Lucia } from "lucia-sveltekit/client";
```

```tsx
<Lucia on:error={handleError}>
    <slot />
</Lucia>
```

#### Events

| name  | description |
| ----- | ----------- |
| error | On error    |

#### Error

The following error name can be accessed via `e.detail`.

```ts
const handleError = (e) => {
    const error = e.detail;
};
```

| name                  | description                           |
| --------------------- | ------------------------------------- |
| AUTH_UNAUTHORIZED     | Unauthorized user                     |
| DATABASE_FETCH_FAILED | Failed to get data from database      |
| UNKNOWN               | Unknown error, likely a network error |
