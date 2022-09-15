## Overview

Methods of [`Lucia`](/references/instances) instance.

```ts
const auth = lucia();
auth.getUser();
```

## Initializing

```ts
const lucia: (configurations: Configurations) => Lucia;
```

## Reference

### authenticateUser

Validates the password (if provided) and creates a new session.

```ts
const authenticateUser: (
    authMethod: string,
    identifier: string,
    password?: string
) => Promise<ServerSession>;
```

#### Errors

| name                          | description                                                               |
| ----------------------------- | ------------------------------------------------------------------------- |
| AUTH_INVALID_IDENTIFIER_TOKEN | A user that matches the auth id and identifier does not exist             |
| AUTH_INVALID_PASSWORD         | Incorrect password (**DO NOT** return this error to the client)           |
| AUTH_OUTDATED_PASSWORD        | The user's password is using an old hashing algorithm and should be reset |
| DATABASE_UPDATE_FAILED        | Failed to update database                                                 |
| DATABASE_FETCH_FAILED         | Failed to get data from database                                          |

### createUser

Creates a new user and a new session.

```ts
const createUser: (
    authMethod: string,
    identifier: string,
    options?: {
        password?: string;
        user_data?: Record<string, any>; // Each key/value will be saved as its own column
    }
) => Promise<ServerSession>;
```

#### Errors

| name                            | description                            |
| ------------------------------- | -------------------------------------- |
| AUTH_DUPLICATE_IDENTIFIER_TOKEN | A user with the same identifier exists |
| AUTH_DUPLICATE_USER_DATA        | The user data violates a unique column |
| DATABASE_UPDATE_FAILED          | Failed to update database              |

### createUserSession

Creates a new session. Reload the page or update the session object for `$session.lucia` (such as `$session.lucia.access_token`) to update.

```ts
const createUserSession: (userId: string) => Promise<ServerSession>;
```

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

#### Errors

| name                   | description               |
| ---------------------- | ------------------------- |
| DATABASE_UPDATE_FAILED | Failed to update database |

### getUser

Gets the user with the corresponding auth id and identifier.

```ts
const getUser: (
    authMethod: string,
    identifier: string
) => Promise<User | null>; // null if user does not exist
```

#### Errors

| name                  | description                      |
| --------------------- | -------------------------------- |
| DATABASE_FETCH_FAILED | Failed to get data from database |

### handleHooks

Returns SvelteKit's handle function. Reference [SvelteKit's handle](https://kit.svelte.dev/docs/hooks#handle). Required to be placed in `hooks.server.js` for Lucia to work.

```ts
import type { Handle } from "@sveltejs/kit/types";
const handleHooks: () => Handle;
```

#### Example

```ts
//  src/server.hooks.js
export const handle = handleHooks();
```

#### With other handle functions

```ts
import { sequence } from "@sveltejs/kit";
import { auth } from "$lib/lucia";

export const handle = sequence(
    auth.handleHooks(),
    customHandle1,
    customHandle2
);
```

### handleServerLoad

### invalidateRefreshToken

Invalidates a refresh token. Should be used before creating a new session using [`createUserSession()`](/server-apis#createusersession) if the previous refresh token hasn't been invalidated. Will succeed regardless of the validity of the refresh token.

```ts
const invalidateRefreshToken: (refreshToken: string) => Promise<void>;
```

#### Errors

| name                   | description               |
| ---------------------- | ------------------------- |
| DATABASE_UPDATE_FAILED | Failed to update database |

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

#### Errors

| name                       | description                      |
| -------------------------- | -------------------------------- |
| AUTH_INVALID_REFRESH_TOKEN | Invalid refresh token            |
| DATABASE_FETCH_FAILED      | Failed to get data from database |
| DATABASE_UPDATE_FAILED     | Failed to update database        |

### resetUserPassword

Update a user's password. Will also invalidate all refresh tokens. Use [`createUserSession()`](/server-apis#createusersession) to create a new set of tokens.

```ts
const resetUserPassword: (
    userId: string,
    password: string // new password
) => Promise<void>;
```

#### Errors

| name                   | description                                    |
| ---------------------- | ---------------------------------------------- |
| AUTH_INVALID_USER_ID   | A user that matches the user id does not exist |
| DATABASE_UPDATE_FAILED | Failed to update database                      |

### updateUserData

Update a user's identifier token (auth id and identifier).

```ts
const updateUserData: (
    userId: string,
    userData: Partial<UserData> // Key/values to update
) => Promise<void>;
```

#### Errors

| name                   | description                                    |
| ---------------------- | ---------------------------------------------- |
| AUTH_INVALID_USER_ID   | A user that matches the user id does not exist |
| DATABASE_UPDATE_FAILED | Failed to update database                      |

### updateUserIdentifierToken

Update a user's identifier token (auth id and identifier).

```ts
const updateUserIdentifierToken: (
    userId: string, // target user id
    authMethod: string, // new auth method
    identifier: string // new identifier
) => Promise<void>;
```

#### Errors

| name                   | description                                    |
| ---------------------- | ---------------------------------------------- |
| AUTH_INVALID_USER_ID   | A user that matches the user id does not exist |
| DATABASE_UPDATE_FAILED | Failed to update database                      |

### validateAccessToken

Validates access token and returns the user if valid.

```ts
const validateAccessToken = (accessToken: string, fingerprintToken: string) =>
    Promise<User>;
```

#### Returns

| name | type                           | description |
| ---- | ------------------------------ | ----------- |
|      | [User](/references/types#user) |             |

### validateRequest

Checks if the request was made by an authenticated user using the authorization header. The access token should be sent as a bearer token inside the authorization header. For GET and POST requests.

```ts
const validateRequest: (
    request: Request // sveltekit RequestEvent.Request
) => Promise<ServerSession>;
```

#### Errors

| name                      | description                                              |
| ------------------------- | -------------------------------------------------------- |
| AUTH_INVALID_ACCESS_TOKEN | The access token in the authorization headers in invalid |

### validateRequestByCookie

Checks if the request was made by an authenticated user using cookies. **Do NOT use this for POST or PUT requests as it is vulnerable to CSRF attacks**, and it will throw an error if it is not a GET request for preventive measures.

```ts
const validateRequest: (
    request: Request // sveltekit RequestEvent.Request
) => Promise<ServerSession>;
```

#### Errors

| name                      | description                                              |
| ------------------------- | -------------------------------------------------------- |
| AUTH_INVALID_ACCESS_TOKEN | The access token in the authorization headers in invalid |
| AUTH_INVALID_REQUEST      | The request method is not "GET"                          |
