## Overview

Methods of [`Lucia`](/references/instances) instance.

```ts
const auth = lucia();
auth.getUser();
```

## Initializing

```ts
const lucia = <UserData extends {}>(configurations: Configurations) =>
    Lucia<UserData>;
```

#### Parameters

| name    | type                              | description |
| ------- | --------------------------------- | ----------- |
| configs | [configurations](/configurations) |             |

#### Returns

| name  | type                                 | description |
| ----- | ------------------------------------ | ----------- |
| Lucia | [Lucia](/references/instances#lucia) |             |

#### Types

| name     | type         | description                                                                                                     |
| -------- | ------------ | --------------------------------------------------------------------------------------------------------------- |
| UserData | extends `{}` | Any optional key/types stored inside the `user` table. Every `UserData` in "Reference" refers to this generic. |

#### Example

Where columns `username` and `age` are in the `user` table as [user_data].

```ts
const auth = lucia<{ username: string; age: number }>({
    adapter: adapter(),
    env: "DEV",
    secret: "aWmJoT0gOdjh2-Zc2Zv3BTErb29qQNWEunlj",
});
```

abcdefghijklmnopqrstucwxyz

## Reference

### authenticateUser

Validates the password (if provided) and creates a new session.

```ts
const authenticateUser: (
    authId: string,
    identifier: string,
    password?: string
) => Promise<Session<UserData>>;
```

#### Parameters

| name       | type                | description |
| ---------- | ------------------- | ----------- |
| authId     | string              |             |
| identifier | string              |             |
| password   | string \| undefined | password    |

#### Returns

| name | type                                 | description |
| ---- | ------------------------------------ | ----------- |
|      | [Session](/references/types#session) |             |

#### Errors

| name                          | description                                                     |
| ----------------------------- | --------------------------------------------------------------- |
| AUTH_INVALID_IDENTIFIER_TOKEN | A user that matches the auth id and identifier does not exist   |
| AUTH_INVALID_PASSWORD         | Incorrect password (**DO NOT** return this error to the client) |
| DATABASE_UPDATE_FAILED        | Failed to update database                                       |
| DATABASE_FETCH_FAILED         | Failed to get data from database                                |

### createUser

Creates a new user and a new session.

```ts
const createUser: (
    authId: string,
    identifier: string,
    options?: { password?: string; user_data?: Record<string, any> }
) => Promise<Session<UserData>>;
```

#### Parameters

| name              | type                             | description                                    |
| ----------------- | -------------------------------- | ---------------------------------------------- |
| authId            | string                           |                                                |
| identifier        | string                           |                                                |
| options.password  | string \| undefined              | password                                       |
| options.user_data | Record<string, any> \| undefined | Each key/value will be saved as its own column |

#### Returns

| name | type                                 | description |
| ---- | ------------------------------------ | ----------- |
|      | [Session](/references/types#session) |             |

#### Errors

| name                            | description                            |
| ------------------------------- | -------------------------------------- |
| AUTH_DUPLICATE_IDENTIFIER_TOKEN | A user with the same identifier exists |
| AUTH_DUPLICATE_USER_DATA        | The user data violates a unique column |
| DATABASE_UPDATE_FAILED          | Failed to update database              |

### createUserSession

Creates a new session.

```ts
const createUserSession: (userId: string) => Promise<Session<UserData>>;
```

#### Parameters

| name   | type   | description    |
| ------ | ------ | -------------- |
| userId | string | Target user id |

#### Returns

| name | type                                 | description |
| ---- | ------------------------------------ | ----------- |
|      | [Session](/references/types#session) |             |

#### Errors

| name                   | description                                    |
| ---------------------- | ---------------------------------------------- |
| AUTH_INVALID_USER_ID   | A user that matches the user id does not exist |
| DATABASE_UPDATE_FAILED | Failed to update database                      |
| DATABASE_FETCH_FAILED  | Failed to get data from database               |

### deleteUser

Deletes user and all refresh tokens connect to them. Will be succeed regardless of the validity of the user id.

```ts
const deleteUser: (userId: string) => Promise<void>;
```

#### Parameters

| name   | type   | description |
| ------ | ------ | ----------- |
| userId | string | User id     |

#### Errors

| name                   | description               |
| ---------------------- | ------------------------- |
| DATABASE_UDPATE_FAILED | Failed to update database |

### getSession

SvelteKit's getSession function. Refer to [SvelteKit's getSession](https://kit.svelte.dev/docs/hooks#getsession).

```ts
import type { GetSession } from "@sveltejs/kit/types";
const getAuthSession: GetSession;
```

### getUser

Gets the user with the corresponding auth id and identifier.

```ts
const getUser: (
    authId: string,
    identifier: string
) => Promise<User<UserData> | null>;
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

### invalidateRefreshToken

Invalidates a refresh token. Should be used before creating a new session using [`createUserSession()`](/server-apis#createusersession) if the previous refresh token hasn't been invalidated. Will succeed regardless of the validity of the refresh token.

```ts
const invalidateRefreshToken: (refreshToken: string) => Promise<void>;
```

#### Parameters

| name         | type   | description          |
| ------------ | ------ | -------------------- |
| refreshToken | string | Target refresh token |

#### Errors

| name                   | description               |
| ---------------------- | ------------------------- |
| DATABASE_UDPATE_FAILED | Failed to update database |

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

### resetUserPassword

Update a user's password. Will also invalidate all refresh tokens. Use [`createUserSession()`](/server-apis#createusersession) to create a new set of tokens.

```ts
const resetUserPassword: (userId: string, password: string) => Promise<void>;
```

#### Parameters

| name     | type   | description    |
| -------- | ------ | -------------- |
| userId   | string | Target user id |
| password | string | New password   |

#### Errors

| name                   | description                                    |
| ---------------------- | ---------------------------------------------- |
| AUTH_INVALID_USER_ID   | A user that matches the user id does not exist |
| DATABASE_UDPATE_FAILED | Failed to update database                      |

### updateUserData

Update a user's identifier token (auth id and identifier).

```ts
const updateUserData: (
    userId: string,
    userData: Partial<UserData>
) => Promise<void>;
```

#### Parameters

| name     | type              | description          |
| -------- | ----------------- | -------------------- |
| userId   | string            | Target user id       |
| userData | Partial\<UserData\> | Key/values to update |

#### Errors

| name                   | description                                    |
| ---------------------- | ---------------------------------------------- |
| AUTH_INVALID_USER_ID   | A user that matches the user id does not exist |
| DATABASE_UDPATE_FAILED | Failed to update database                      |

### updateUserIdentifierToken

Update a user's identifier token (auth id and identifier).

```ts
const updateUserIdentifierToken: (
    userId: string,
    authId: string,
    identifier: string
) => Promise<void>;
```

#### Parameters

| name       | type   | description    |
| ---------- | ------ | -------------- |
| userId     | string | Target user id |
| authId     | string | New auth id    |
| identifier | string | New identifier |

#### Errors

| name                   | description                                    |
| ---------------------- | ---------------------------------------------- |
| AUTH_INVALID_USER_ID   | A user that matches the user id does not exist |
| DATABASE_UDPATE_FAILED | Failed to update database                      |

### validateRequest

Checks if the request was made by an authenticated user.

```ts
const validateRequest: (request: Request) => Promise<User<UserData>>;
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
