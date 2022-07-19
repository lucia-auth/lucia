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

### autoRefreshAccessToken

Listens for access token expiration and fetches a new token.

```ts
const autoRefreshAccessToken: (
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
const unsubscribe = autoRefreshAccessToken();

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

### refreshAccessToken

Refreshes access token.

```ts
const refreshAccessToken: (refreshToken: string) => string;
```

#### Parameters

| name         | type   | description |
| ------------ | ------ | ----------- |
| refreshToken | string |             |

#### Returns

| name        | type   | description        |
| ----------- | ------ | ------------------ |
| accessToken | string | A new access token |

#### Errors

| name                  | description                           |
| --------------------- | ------------------------------------- |
| AUTH_UNAUTHORIZED     | Unauthorized user                     |
| DATABASE_FETCH_FAILED | Failed to get data from database      |
| UKNOWN                | Unknown error, likely a network error |
