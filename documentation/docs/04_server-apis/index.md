## Overview

These are available after initializing `Lucia()`.

```ts
// $lib/lucia.ts
export const auth = lucia();
```

```ts
import { auth } from "$lib/lucia";
```

## Reference

### handle

SvelteKit's handle function. Refer to [SvelteKit's handle](https://kit.svelte.dev/docs/hooks#handle).

```ts
import type { Handle } from "@sveltejs/kit/types";
const handleAuth: Handle;
```

#### Using with other handle functions

```ts
// hooks
import { sequence } from "@sveltejs/kit";
import { auth } from "$lib/lucia";

export const handle = sequence(auth.handleAuth, customHandle1, customHandle2);
```

### getSession

SvelteKit's getSession function. Refer to [SvelteKit's getSession](https://kit.svelte.dev/docs/hooks#getsession).

```ts
import type { GetSession } from "@sveltejs/kit/types";
const getAuthSession: GetSession;
```

### validateRequest

Checks if the request was made by an authenticated user.

```ts
const validateRequest: (request: Request) => Promise<LuciaUser>;
```

#### Parameters

| name    | type    | description                                       |
| ------- | ------- | ------------------------------------------------- |
| request | Request | `event.request` from SvelteKit's `RequestHandler` |

#### Returns

| name | type      | description |
| ---- | --------- | ----------- |
|      | LuciaUser |             |

#### Errors

| name                      | description                                              |
| ------------------------- | -------------------------------------------------------- |
| AUTH_INVALID_ACCESS_TOKEN | The access token in the authorization headers in invalid |

### getUser

Gets the user with the corresponding auth id and identifier.

```ts
const getUser: (authId: string, identifier: string) => Promise<LuciaUser | null>;
```

#### Parameters

| name       | type   | description |
| ---------- | ------ | ----------- |
| authId     | string | auth id     |
| identifier | string | identifier  |

#### Returns

Returns `LuciaUser` if a user exists, `null` is not.

| name | type      | description |
| ---- | --------- | ----------- |
|      | LuciaUser |             |

#### Errors

| name                          | description                          |
| ----------------------------- | ------------------------------------ |
| DATABASE_FETCH_FAILED         | Failed to get data from database     |

### createUser

Creates a new user.

```ts
const createUser: (
    authId: string,
    identifier: string,
    options?: { password?: string; user_data?: Record<string, any> }
) => Promise<{
    user: LuciaUser;
    access_token: string;
    refresh_token: string;
    fingerprint: string;
    cookies: {
        all: string[];
        access_token: string;
        refresh_token: string;
        fingerprint: string;
    };
}>;
```

#### Parameters

| name              | type                | description                                                 |
| ----------------- | ------------------- | ----------------------------------------------------------- |
| authId            | string              |                                                             |
| identifier        | string              |                                                             |
| options.password  | string              | _(optional)_ password                                       |
| options.user_data | Record<string, any> | _(optional)_ Each key/value will be saved as its own column |

#### Returns

| name                  | type      | description                  |
| --------------------- | --------- | ---------------------------- |
| user                  | LuciaUser |                              |
| access_token          | string    |                              |
| refresh_token         | string    |                              |
| fingerprint           | string    |                              |
| cookies.all           | string[]  | An array of all the cookies  |
| cookies.access_token  | string    | Cookie for the access token  |
| cookies.refresh_token | string    | Cookie for the refresh token |
| cookies.fingerprint   | string    | Cookie for the fingerprint   |

#### Errors

| name                           | description                            |
| ------------------------------ | -------------------------------------- |
| AUTH_DUPLICATE_IDENTIFER_TOKEN | A user with the same identifier exists |
| AUTH_DUPLICATE_USER_DATA       | The user data violates a unique column |
| DATABASE_UPDATE_FAILED         | Failed to update database              |

### authenticateUser

Authenticates a user.

```ts
const authenticateUser: (
    authId: string,
    identifier: string,
    password?: string
) => Promise<{
    user: LuciaUser;
    access_token: string;
    refresh_token: string;
    fingerprint: string;
    cookies: {
        all: string[];
        access_token: string;
        refresh_token: string;
        fingerprint: string;
    };
}>;
```

#### Parameters

| name       | type   | description           |
| ---------- | ------ | --------------------- |
| authId     | string |                       |
| identifier | string |                       |
| password   | string | _(optional)_ password |

#### Returns

| name                  | type      | description                  |
| --------------------- | --------- | ---------------------------- |
| user                  | LuciaUser |                              |
| access_token          | string    |                              |
| refresh_token         | string    |                              |
| fingerprint           | string    |                              |
| cookies.all           | string[]  | An array of all the cookies  |
| cookies.access_token  | string    | Cookie for the access token  |
| cookies.refresh_token | string    | Cookie for the refresh token |
| cookies.fingerprint   | string    | Cookie for the fingerprint   |

#### Errors

| name                          | description                                                     |
| ----------------------------- | --------------------------------------------------------------- |
| AUTH_INVALID_IDENTIFIER_TOKEN | A user that matches the auth id and identifier does not exist   |
| AUTH_INVALID_PASSWORD         | Incorrect password (**DO NOT** return this error to the client) |
| DATABASE_UPDATE_FAILED        | Failed to update database                                       |
| DATABASE_FETCH_FAILED         | Failed to get data from database                                |

### refreshAccessToken

Validates the refresh token using the fingerprint and return a new access token.

```ts
const refreshAccessToken: (
    refreshToken: string,
    fingerprint: string
) => Promise<{
    value: string;
    cookie: string;
}>;
```

#### Parameters

| name        | type   | description                               |
| ----------- | ------ | ----------------------------------------- |
| accessToken | string | A refresh token                           |
| fingerprint | string | value from `fingerprint` http-only cookie |

#### Returns

| name   | type   | description            |
| ------ | ------ | ---------------------- |
| value  | string | A new access token     |
| cookie | string | A cookie for the token |

#### Errors

| name                       | description                      |
| -------------------------- | -------------------------------- |
| AUTH_INVALID_REFRESH_TOKEN | Invalid refresh token            |
| DATABASE_FETCH_FAILED      | Failed to get data from database |

#### Saving the token

```ts
// in an endpoint
const refreshAccessToken = await auth.refreshAccessToken();
return {
    headers: {
        "set-cookie": [refreshAccessToken.cookie],
    },
};
```
