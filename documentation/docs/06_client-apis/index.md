## Overview

These can be imported from `lucia-sveltekit/client`.

```ts
import { signInWithOAuthProvider } from "lucia-sveltekit/client";
```

## Reference

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

### autoRefreshTokens

Listens for access token expiration and fetches a new refresh and access token.

```ts
const autoRefreshTokens: (
    session: Writable<App.session>,
    onError?: () => void = () => {}
) => () => void;
```

#### Parameters

| name    | type                  | description                    |
| ------- | --------------------- | ------------------------------ |
| session | Writable<App.session> | The session stores             |
| onError | function              | _(optional)_ Callback on error |

#### Returns

Returns a functions that unsubscribes from the listener, which should be called on component/page destroy (`onDestroy()`).

```js
const unsubscribe = autoRefreshTokens();

onDestroy(() => {
    unsubscribe();
});
```

#### Errors

| name                  | description                           |
| --------------------- | ------------------------------------- |
| AUTH_UNAUTHORIZED     | Unauthorized user                     |
| DATABASE_FETCH_FAILED | Failed to get data from database      |
| UKNOWN                | Unknown error, likely a network error |

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
