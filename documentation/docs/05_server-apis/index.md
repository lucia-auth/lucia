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
const validateRequest: (request: Request) => Promise<User>;
```

#### Parameters

| name    | type    | description                                       |
| ------- | ------- | ------------------------------------------------- |
| request | Request | `event.request` from SvelteKit's `RequestHandler` |

#### Returns

| name | type                           | description |
| ---- | ------------------------------ | ----------- |
|      | [User](/references/types#user) |             |

#### Errors

| name                      | description                                              |
| ------------------------- | -------------------------------------------------------- |
| AUTH_INVALID_ACCESS_TOKEN | The access token in the authorization headers in invalid |

### getUser

Gets the user with the corresponding auth id and identifier.

```ts
const getUser: (authId: string, identifier: string) => Promise<User | null>;
```

#### Parameters

| name       | type   | description |
| ---------- | ------ | ----------- |
| authId     | string | auth id     |
| identifier | string | identifier  |

#### Returns

Returns `User` if a user exists, `null` is not.

| name | type                           | description |
| ---- | ------------------------------ | ----------- |
|      | [User](/references/types#user) |             |

#### Errors

| name                  | description                      |
| --------------------- | -------------------------------- |
| DATABASE_FETCH_FAILED | Failed to get data from database |

### createUser

Creates a new user.

```ts
const createUser: (
    authId: string,
    identifier: string,
    options?: { password?: string; user_data?: Record<string, any> }
) => Promise<{
    user: User;
    access_token: AccessToken;
    refresh_token: RefreshToken;
    fingerprint_token: FingerprintToken;
    cookies: string[];
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

| name              | type                                                        | description                 |
| ----------------- | ----------------------------------------------------------- | --------------------------- |
| user              | [User](/references/types#user)                              |                             |
| access_token      | [AccessToken](/references/instances#accesstoken)            |                             |
| refresh_token     | [RefreshToken](/references/instances#refreshtoken)          |                             |
| fingerprint_token | [Fingerprint_Token](/references/instances#fingerprinttoken) |                             |
| cookies           | string[]                                                    | An array of all the cookies |

#### Errors

| name                           | description                            |
| ------------------------------ | -------------------------------------- |
| AUTH_DUPLICATE_IDENTIFIER_TOKEN | A user with the same identifier exists |
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
    user: User;
    access_token: AccessToken;
    refresh_token: RefreshToken;
    fingerprint_token: FingerprintToken;
    cookies: string[];
}>;
```

#### Parameters

| name       | type   | description           |
| ---------- | ------ | --------------------- |
| authId     | string |                       |
| identifier | string |                       |
| password   | string | _(optional)_ password |

#### Returns

| name              | type                                                       | description                 |
| ----------------- | ---------------------------------------------------------- | --------------------------- |
| user              | [User](/references/types#user)                             |                             |
| access_token      | [AccessToken](/references/instances#accesstoken)           |                             |
| refresh_token     | [RefreshToken](/references/instances#refreshtoken)         |                             |
| fingerprint_token | [FingerprintToken](/references/instances#fingerprinttoken) |                             |
| cookies           | string[]                                                   | An array of all the cookies |

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
const refreshTokens: (
    refreshToken: string,
    fingerprintToken: string
) => Promise<{
    refresh_token: RefreshToken;
    access_token: AccessToken;
}>;
```

#### Parameters

| name             | type   | description       |
| ---------------- | ------ | ----------------- |
| accessToken      | string | A refresh token   |
| fingerprintToken | string | Fingerprint token |

#### Returns

| name          | type                                               | description |
| ------------- | -------------------------------------------------- | ----------- |
| access_token  | [AccessToken](/references/instances#accesstoken)   |             |
| refresh_token | [RefreshToken](/references/instances#refreshtoken) |             |

#### Errors

| name                       | description                      |
| -------------------------- | -------------------------------- |
| AUTH_INVALID_REFRESH_TOKEN | Invalid refresh token            |
| DATABASE_FETCH_FAILED      | Failed to get data from database |
| DATABASE_UDPATE_FAILED     | Failed to update database        |