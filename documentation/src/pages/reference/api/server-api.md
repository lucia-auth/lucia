---
order: 0
layout: "@layouts/DocumentLayout.astro"
title: "Server API"
---

These can be imported from `lucia-sveltekit`. Can only be used inside a server context (.server.ts).

```ts
import { generateRandomString } from "lucia-sveltekit";
```

## `generateRandomString()`

Generates a random string of a defined length. Is cryptographically random.

```ts
const generateRandomString: (length: number) => string;
```

#### Parameter

| name   | type     | description                     |
| ------ | -------- | ------------------------------- |
| length | `number` | The length of the output string |

#### Returns

| type     | description                 |
| -------- | --------------------------- |
| `string` | A randomly generated string |

#### Example

```ts
const randomString = generateRandomString(8);
```

## `lucia()`

Creates a new `Lucia` instance.

```ts
const lucia: (configs: Configurations) => Lucia;
```

#### Parameter

| name    | type             | description                                                                                         |
| ------- | ---------------- | --------------------------------------------------------------------------------------------------- |
| configs | `Configurations` | Options for Lucia - refer to [Lucia configurations](/reference/configurations/lucia-configurations) |

#### Example

```ts
const auth = lucia(configs);
```

### `authenticateUser()`

Validates the user's password using the provider id. Will not work with users without a password.

```ts
const authenticateUser: (
    provider: string,
    identifier: string,
    password: string
) => Promise<User>;
```

#### Parameter

| name       | type     | description   |
| ---------- | -------- | ------------- |
| provider   | `string` | Provider name |
| identifier | `string` | Identifier    |
| password   | `string` | Password      |

#### Returns

| type                                        | description            |
| ------------------------------------------- | ---------------------- |
| [`User`](/reference/types/lucia-types#user) | The authenticated user |

#### Errors

| name                     | description                                         |
| ------------------------ | --------------------------------------------------- |
| AUTH_INVALID_PROVIDER_ID | The user with the provider does not exist           |
| AUTH_INVALID_PASSWORD    | Incorrect password                                  |
| AUTH_OUTDATED_PASSWORD   | The user's password is hashed with an old algorithm |
| DATABASE_FETCH_FAILED    | Failed to fetch data from the database              |

#### Example

```ts
import { auth } from "$lib/server/lucia";

try {
    await auth.authenticateUser("email", "user@example.com", "123456");
} catch {
    // invalid credentials
}
```

### `createSession()`

Creates a new session of a user.

```ts
const createSession: (userId: string) => Promise<{
    session: Session;
    tokens: Tokens;
}>;
```

#### Parameter

| name   | type     | description                          |
| ------ | -------- | ------------------------------------ |
| userId | `string` | The user id of the session to create |

#### Returns

| name    | type                                            | description                           |
| ------- | ----------------------------------------------- | ------------------------------------- |
| session | [`Session`](/reference/types/lucia-types#session)                                       | The newly created session             |
| tokens  | [`Tokens`](/reference/types/lucia-types#tokens) | The tokens and cookies of the session |

#### Errors

| name                   | description                              |
| ---------------------- | ---------------------------------------- |
| AUTH_INVALID_USER_ID   | The user with the user id does not exist |
| DATABASE_UPDATE_FAILED | Failed to update database                |

#### Example

```ts
import { auth } from "$lib/server/lucia";
try {
    await auth.createSession(userId);
} catch {
    // invalid user id
}
```

### `createUser()`

Creates a new user.

```ts
const createUser: (
    provider: string,
    identifier: string,
    options?: {
        password?: string;
        userData?: Lucia.UserData;
    }
) => Promise<User>;
```

#### Parameter

| name             | type             | description                                             | optional |
| ---------------- | ---------------- | ------------------------------------------------------- | -------- |
| provider         | `string`         | The provider of the user to create                      |          |
| identifier       | `string`         | The identifier of the user˝ to create                   |          |
| options.password | `string`         | The password of the user - can be undefined to omit it. | true     |
| options.userData | `Lucia.UserData` | Additional user data to store in `user` table           | true     |

#### Returns

| type                                        | description            |
| ------------------------------------------- | ---------------------- |
| [`User`](/reference/types/lucia-types#user) | The newly created user |

#### Errors

| name                       | description                                           |
| -------------------------- | ----------------------------------------------------- |
| AUTH_DUPLICATE_PROVIDER_ID | The user with the provider and identifier exists      |
| AUTH_DUPLICATE_USER_DATA   | One of the user data value violates unique constraint |
| DATABASE_UPDATE_FAILED     | Failed to update database                             |

#### Example

```ts
import { auth } from "$lib/server/lucia";

try {
    await auth.createUser("email", "user@example.com", {
        password: "123456",
        userData: {
            username: "user123",
            isAdmin: true,
        },
    });
} catch {
    // error
}
```

### `deleteAllCookies()`

Deletes all cookies created by Lucia.

```ts
const deleteAllCookies: (cookie: Cookie) => Promise<void>;
```

#### Parameter

| name   | type   | description               |
| ------ | ------ | ------------------------- |
| cookie | Cookie | SvelteKit's cookie module |

#### Example

```ts
import { auth } from "$lib/server/lucia";
import type { Action } from "@sveltejs/kit";

const action: Action = async ({ cookie }) => {
    auth.deleteAllCookies(cookie);
};
```

### `deleteExpiredUserSessions()`

Removes all expired session of a user from the `session` table. Will succeed regardless of the validity of the user id

```ts
const deleteExpiredUserSessions: (userId: string) => Promise<void>;
```

#### Parameter

| name   | type     | description         |
| ------ | -------- | ------------------- |
| userId | `string` | User id of the user |

#### Errors

| name                   | description               |
| ---------------------- | ------------------------- |
| DATABASE_UPDATE_FAILED | Failed to update database |

#### Example

```ts
import { auth } from "lucia-sveltekit";

try {
    await auth.deleteExpiredUserSession(userId);
} catch {
    // error
}
```

### `deleteUser()`

Deletes a user. Will succeed regardless of the validity of the user id.

```ts
const deleteUser: (userId: string) => Promise<void>;
```

#### Parameter

| name   | type     | description                   |
| ------ | -------- | ----------------------------- |
| userId | `string` | User id of the user to delete |

#### Errors

| name                   | description               |
| ---------------------- | ------------------------- |
| DATABASE_UPDATE_FAILED | Failed to update database |

#### Example

```ts
import { auth } from "$lib/server/lucia";

try {
    await auth.deleteUser(userId);
} catch {
    // error
}
```

### `getSessionUser()`

Validates the access token, and gets the user of the session.

```ts
const getSessionUser: (accessToken: userId) => Promise<User>;
```

#### Parameter

| name        | type     | description                 |
| ----------- | -------- | --------------------------- |
| accessToken | `string` | Access token of the session |

#### Returns

| type                                        | description                                 |
| ------------------------------------------- | ------------------------------------------- |
| [`User`](/reference/types/lucia-types#user) | The user of the session of the access token |

#### Errors

| name                      | description                                      |
| ------------------------- | ------------------------------------------------ |
| AUTH_INVALID_ACCESS_TOKEN | The session with the access token does not exist |
| DATABASE_FETCH_FAILED     | Failed to fetch data from the database           |

#### Example

```ts
import { auth } from "$lib/server/lucia";

try {
    await auth.getSessionUser(accessToken);
} catch {
    // invalid access token
}
```

### `getUser()`

Gets a user.

```ts
const getUser: (userId: string) => Promise<User>;
```

#### Parameter

| name   | type     | description         |
| ------ | -------- | ------------------- |
| userId | `string` | User id of the user |

#### Returns

| type                                        | description               |
| ------------------------------------------- | ------------------------- |
| [`User`](/reference/types/lucia-types#user) | The user with the user id |

#### Errors

| name                  | description                              |
| --------------------- | ---------------------------------------- |
| AUTH_INVALID_USER_ID  | The user with the user id does not exist |
| DATABASE_FETCH_FAILED | Failed to fetch data from the database   |

#### Example

```ts
import { auth } from "$lib/server/lucia";

try {
    await auth.getUser(userId);
} catch {
    // invalid user id
}
```

### `getUserByProviderId()`

Get a user by the provider id (provider name, identifier).

```ts
const getUserByProviderId: (
    provider: string,
    identifier: string
) => Promise<User>;
```

#### Parameter

| name       | type     | description                   |
| ---------- | -------- | ----------------------------- |
| provider   | `string` | The provider name of the user |
| identifier | `string` | The identifier of the user    |

#### Returns

| type                                        | description                   |
| ------------------------------------------- | ----------------------------- |
| [`User`](/reference/types/lucia-types#user) | The user with the provider id |

#### Errors

| name                     | description                                  |
| ------------------------ | -------------------------------------------- |
| AUTH_INVALID_PROVIDER_ID | The user with the provider id does not exist |
| DATABASE_FETCH_FAILED    | Failed to fetch data from the database       |

#### Example

```ts
import { auth } from "$lib/server/lucia";

try {
    await auth.getUserByProviderId("email", "user@example.com");
} catch {
    // invalid provider id
}
```

### `handleHooks()`

For the handle function in hooks. Handles requests to Lucia's APIs and creates a new global variable in the browser.

```ts
const handleHooks: () => Handle;
```

#### Returns

| type     | description       |
| -------- | ----------------- |
| `Handle` | A handle function |

#### Example

```ts
import { auth } from "$lib/server/lucia";

export const handle: Handle = auth.handleHooks();
```

```ts
import { auth } from "$lib/server/lucia";
import { sequence } from "@sveltejs/kit";

export const handle: Handle = sequence(auth.handleHooks(), customHandle);
```

### `handleServerSession()`

For the root layout server load function. Reads the cookies and gets the user of the access token. Refreshes the session if the access token has expired. If a server load function is provided, Lucia will run it after it finishes handling tokens. The load function may also return data.

```ts
const handleServerSession: (serverLoad?: ServerLoad) => ServerLoad;
```

#### Parameter

| name       | type         | description            | optional |
| ---------- | ------------ | ---------------------- | -------- |
| serverLoad | `ServerLoad` | A server load function | true     |

#### Returns

| type         | description            |
| ------------ | ---------------------- |
| `ServerLoad` | A server load function |

#### Example

```ts
import { auth } from "$lib/server/lucia";
import type { ServerLoad } from "@sveltejs/kit";

export const Load: ServerLoad = auth.handleServerSession(async (event) => {
    return {
        message: "hi",
    };
});
```

### `invalidateAllUserSessions()`

Invalidates all sessions of a user. Will succeed regardless of the validity of the user id.

```ts
const invalidateAllUserSessions: (userId: string) => Promise<void>;
```

#### Parameter

| name   | type     | description         |
| ------ | -------- | ------------------- |
| userId | `string` | User id of the user |

#### Errors

| name                   | description               |
| ---------------------- | ------------------------- |
| DATABASE_UPDATE_FAILED | Failed to update database |

#### Example

```ts
import { auth } from "$lib/server/lucia";

try {
    await auth.invalidateAllUserSession(userId);
} catch {
    // error
}
```

### `invalidateSession()`

Invalidates an access token and the session connected to it. Will succeed regardless of the validity of the access token.

```ts
const invalidateSession: (accessToken: string) => Promise<void>;
```

#### Parameter

| name        | type     | description                 |
| ----------- | -------- | --------------------------- |
| accessToken | `string` | Access token of the session |

#### Errors

| name                   | description               |
| ---------------------- | ------------------------- |
| DATABASE_UPDATE_FAILED | Failed to update database |

#### Example

```ts
import { auth } from "lucia-sveltekit";

try {
    await auth.invalidateSession(accessToken);
} catch {
    // error
}
```

### `parseRequest()`

Checks if the request is from a trusted origin if `configuration.csrfProtection` is true, and gets the access token and refresh token from the cookie.

```ts
const parseRequest: (request: Request) => Promise<{
    accessToken: string;
    refreshToken: string;
}>;
```

#### Parameter

| name    | type      | description                            |
| ------- | --------- | -------------------------------------- |
| request | `Request` | Request from SvelteKit's `ServerEvent` |

#### Returns

| name         | type    | description                                                              |
| ------------ | ------- | ------------------------------------------------------------------------ |
| accessToken  | `string | The access token read from the request - an empty string if none exists  |
| refreshToken | `string | The refresh token read from the request - an empty string if none exists |

#### Errors

| name                 | description                              |
| -------------------- | ---------------------------------------- |
| AUTH_INVALID_REQUEST | The request is not from a trusted origin |

#### Example

```ts
import { auth } from "lucia-sveltekit";
import type { Action } from "@sveltejs/kit";

const action: Action = async ({ request }) => {
    try {
        const { accessToken } = await auth.parseRequest(request);
    } catch {
        // request from untrusted domain
    }
};
```

### `refreshSession()`

Checks the validity of the refresh token and refreshes the session.

```ts
const refreshSession: (refreshToken: string) => Promise<{
    session: Session;
    tokens: Tokens;
}>;
```

#### Parameter

| name         | type     | description     |
| ------------ | -------- | --------------- |
| refreshToken | `string` | A refresh token |

#### Returns

| name    | type                                            | description                           |
| ------- | ----------------------------------------------- | ------------------------------------- |
| session | [`Session`](/reference/types/lucia-types#session)                                       | The newly created session             |
| tokens  | [`Tokens`](/reference/types/lucia-types#tokens) | The tokens and cookies of the session |

#### Errors

| name                       | description                            |
| -------------------------- | -------------------------------------- |
| AUTH_INVALID_REFRESH_TOKEN | Invalid refresh token                  |
| DATABASE_UPDATE_FAILED     | Failed to update database              |
| DATABASE_FETCH_FAILED      | Failed to fetch data from the database |

#### Example

```ts
import { auth } from "lucia-sveltekit";

try {
    await auth.refreshSession(refreshToken);
} catch {
    // error
}
```

### `updateUserData()`

Updates one of the custom fields in the `user` table. The keys of `userData` should be the `camelCase` version of the `snake_case` column in the `user` table, and the values of it can be `null` but not `undefined`.

```ts
const updateUserData: (
    userId: string,
    userData: Partial<Lucia.UserData>
) => Promise<User>;
```

#### Parameter

| name     | type                              | description                                                             |
| -------- | --------------------------------- | ----------------------------------------------------------------------- |
| userId   | `string`                          | A refresh token                                                         |
| userData | `Partial<`[`Lucia.UserData`]()`>` | Key-value pairs of some or all of the column in `user` table to update. |

#### Returns

| type                                        | description      |
| ------------------------------------------- | ---------------- |
| [`User`](/reference/types/lucia-types#user) | The updated user |

#### Errors

| name                     | description                                  |
| ------------------------ | -------------------------------------------- |
| AUTH_INVALID_USER_ID     | Invalid refresh token                        |
| AUTH_DUPLICATE_USER_DATA | One of the column violates unique constraint |
| DATABASE_UPDATE_FAILED   | Failed to update database                    |

#### Example

```ts
import { auth } from "lucia-sveltekit";

try {
    await auth.updateUserData(userId, {
        username: "user123",
    });
} catch {
    // error
}
```

### `updateUserPassword()`

Updates a user's password.

```ts
const updateUserPassword: (
    userId: string,
    password: string | null
) => Promise<User>;
```

#### Parameter

| name     | type             | description     |
| -------- | ---------------- | --------------- |
| userId   | `string`         | A refresh token |
| password | `string \| null` | A new password  |

#### Returns

| type                                        | description      |
| ------------------------------------------- | ---------------- |
| [`User`](/reference/types/lucia-types#user) | The updated user |

#### Errors

| name                   | description               |
| ---------------------- | ------------------------- |
| AUTH_INVALID_USER_ID   | Invalid refresh token     |
| DATABASE_UPDATE_FAILED | Failed to update database |

#### Example

```ts
import { auth } from "lucia-sveltekit";

try {
    await auth.updateUserPassword(userId, "123456");
    await auth.updateUserPassword(userId, null);
} catch {
    // error
}
```

### `updateUserProviderId()`

Updates a user's provider id.

```ts
const updateUserProviderId: (
    userId: string,
    provider: string,
    identifier: string
) => Promise<User>;
```

#### Parameter

| name       | type     | description                          |
| ---------- | -------- | ------------------------------------ |
| userId     | `string` | A refresh token                      |
| provider   | `string` | The provider name of the provider id |
| identifier | `string` | The identifier of the provider id    |

#### Returns

| type                                        | description      |
| ------------------------------------------- | ---------------- |
| [`User`](/reference/types/lucia-types#user) | The updated user |

#### Errors

| name                   | description               |
| ---------------------- | ------------------------- |
| AUTH_INVALID_USER_ID   | Invalid refresh token     |
| DATABASE_UPDATE_FAILED | Failed to update database |

#### Example

```ts
import { auth } from "lucia-sveltekit";

try {
    await auth.updateUserProviderId(userId, "email", "user@example.com");
} catch {
    // error
}
```

### `validateAccessToken()`

Validates an access token.

```ts
const validateAccessToken: (accessToken: string) => Promise<Session>;
```

#### Parameter

| name        | type     | description     |
| ----------- | -------- | --------------- |
| accessToken | `string` | An access token |

#### Returns

| type      | description                     |
| --------- | ------------------------------- |
| [`Session`](/reference/types/lucia-types#session) | The session of the access token |

#### Errors

| name                      | description                            |
| ------------------------- | -------------------------------------- |
| AUTH_INVALID_ACCESS_TOKEN | The access token is invalid            |
| DATABASE_FETCH_FAILED     | Failed to fetch data from the database |

#### Example

```ts
import { auth } from "lucia-sveltekit";

try {
    await auth.validateAccessToken(accessToken);
} catch {
    // invalid
}
```

### `validateRefreshToken()`

Validates a refresh token. When refreshing the session, the current refresh token should be invalidated before creating a new refresh token.

```ts
try {
    const validateRefreshToken: (refreshToken: string) => Promise<string>;
} catch {
    // invalid
}
```

#### Parameter

| name         | type     | description     |
| ------------ | -------- | --------------- |
| refreshToken | `string` | A refresh token |

#### Returns

| type     | description                                  |
| -------- | -------------------------------------------- |
| `string` | The user id of the user of the refresh token |

#### Errors

| name                       | description                            |
| -------------------------- | -------------------------------------- |
| AUTH_INVALID_REFRESH_TOKEN | The access token is invalid            |
| DATABASE_FETCH_FAILED      | Failed to fetch data from the database |

#### Example

```ts
import { auth } from "lucia-sveltekit";

await auth.validateRefreshToken(refreshToken);
```

### `validateRequest()`

Checks if the request is from a trusted domain, and if so, validates the access token. Runs [`parseRequest()`](/reference/api/server-api#parserequest) and [`validateAccessToken()`](/reference/api/server-api#validateaccesstoken).

```ts
const parseRequest: (request: Request) => Promise<Session>;
```

#### Parameter

| name    | type      | description                            |
| ------- | --------- | -------------------------------------- |
| request | `Request` | Request from SvelteKit's `ServerEvent` |

#### Returns

| name         | type    | description                                                              |
| ------------ | ------- | ------------------------------------------------------------------------ |
| accessToken  | `string | The access token read from the request - an empty string if none exists  |
| refreshToken | `string | The refresh token read from the request - an empty string if none exists |

#### Errors

| name                      | description                              |
| ------------------------- | ---------------------------------------- |
| AUTH_INVALID_REQUEST      | The request is not from a trusted origin |
| AUTH_INVALID_ACCESS_TOKEN | The access token is invalid              |
| DATABASE_FETCH_FAILED     | Failed to fetch data from the database   |

#### Example

```ts
import { auth } from "lucia-sveltekit";
import type { Action } from "@sveltejs/kit";

const action: Action = async ({ request }) => {
    try {
        await auth.validateRequest(request);
    } catch {
        // unauthenticated
    }
};
```

## `LuciaError`

Refer to [Error reference](/reference/types/errors).

```ts
class LuciaError extends Error
```

## `setCookie()`

A helper function to set cookie strings using SvelteKit's `Cookie`.

```ts
const setCookie: (cookie: Cookie, ...cookies: string[]) => void;
```

#### Parameter

| name    | type          | description                |
| ------- | ------------- | -------------------------- |
| cookie  | `Cookie`      | SvelteKit's cookie module  |
| cookies | `...string[]` | An array of cookie strings |

#### Example

```ts
import { setCookie } from "lucia-sveltekit";
import type { Action } from "@sveltejs/kit";

const action: Action = async ({ cookie }) => {
    setCookie(cookie, "cookie1=value;", "cookie2=value; path=/;");
};
```
