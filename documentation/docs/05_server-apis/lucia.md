## Overview

Methods of [`Lucia`](/references/instances) instance.

```ts
const auth = lucia({
    // ...
});

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
| AUTH_INVALID_IDENTIFIER_TOKEN | A user that matches the auth method and identifier does not exist         |
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

Gets the user with the corresponding auth method and identifier.

```ts
const getUser: (authMethod: string, identifier: string) => Promise<User | null>; // null if user does not exist
```

#### Errors

| name                  | description                      |
| --------------------- | -------------------------------- |
| DATABASE_FETCH_FAILED | Failed to get data from database |

### handleHooks

Returns SvelteKit's handle function. Reference [SvelteKit's handle](https://kit.svelte.dev/docs/hooks#handle). Required to be placed in `hooks.server.ts` for Lucia to work. This will also modify the html to expose global variable `_lucia_page_data`.

```ts
const handleHooks: () => Handle;
```

#### Example

```ts
//  src/hooks.server.ts
import { auth } from "$lib/server/lucia";

export const handle = auth.handleHooks();
```

#### With other handle functions

```ts
//  src/hooks.server.ts
import { sequence } from "@sveltejs/kit";
import { auth } from "$lib/server/lucia";

export const handle = sequence(
    auth.handleHooks(),
    customHandle1,
    customHandle2
);
```

### handleServerSession

Reads cookies inside server load function and returns the session data for page data. Automatically refreshes the tokens if one is expired. Will run the server load function afterward if provided. This will set property `_lucia` (equal to ServerSession) to the page data which will be used set the session store. The returned function will be correctly typed so SvelteKit will know what the load function will return.

```ts
const handleServerSession: (serverLoad?: ServerLoad) => ServerLoad;
```

#### Example

```ts
// +page.server.ts
import { auth } from "$lib/server/lucia";

export const load = auth.handleServerSession();
```

```ts
// +page.server.ts
import { auth } from "$lib/server/lucia";

/*
sveltekit will know this load function will return an object with property message, _lucia
*/
export const load = auth.handleServerSession(async () => {
    return {
        message: "hello",
    };
});
```

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

Update a user's data. To update the session, delete the current refresh token with [`invalidateRefreshToken`](/server-apis/lucia#invalidaterefreshtoken), create a new session with [`createUserSession`](/server-apis/lucia#createusersession), and refresh the page.

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

Update a user's identifier token (auth method and identifier). To update the session, delete the current refresh token with [`invalidateRefreshToken`](/server-apis/lucia#invalidaterefreshtoken), create a new session with [`createUserSession`](/server-apis/lucia#createusersession), and refresh the page.

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

### getUserFromAccessToken

Validates access token and returns the user if valid.

```ts
const getUserFromAccessToken: (
    accessToken: string,
    fingerprintToken: string
) => Promise<User>;
```

#### Errors

| name                      | description                 |
| ------------------------- | --------------------------- |
| AUTH_INVALID_ACCESS_TOKEN | One of the token is invalid |

### validateFormSubmission

Checks if the form submission was made by an authenticated user. An input with a name of "\_lucia" should hold the value of the access token. Works both in actions and endpoints. The request body should not be tampered with (`formData()`) before calling it.

```ts
const validateFormSubmission: (
    request: Request // sveltekit RequestEvent.Request
) => Promise<ServerSession>;
```

#### Errors

| name                       | description                                              |
| -------------------------- | -------------------------------------------------------- |
| AUTH_INVALID_ACCESS_TOKEN  | The access token in the authorization headers in invalid |
| AUTH_INVALID_REFRESH_TOKEN | The refresh token in the cookies in invalid              |

#### Example

```html
<script>
    import { getSession } from "lucia-sveltekit/client";

    const session = getSession();
</script>

<form method="post">
    <input name="_lucia" value="{$session?.access_token}" type="hidden" />
</form>
```

```ts
// +page.server.ts
import { auth } from "$lib/server/lucia";
import type { Actions } from "@sveltejs/kit";

export const actions: Actions = {
    default: async ({ request }) => {
        try {
            const session = await auth.validateFormSubmission(request);
        } catch {
            // ...
        }
    },
};
```

### validateRequest

Checks if the request was made by an authenticated user using the authorization header. The access token should be sent as a bearer token inside the authorization header. For GET and POST requests. The request body should not be tampered with (`json()`, `text()`, `formData()`) before calling it.

```ts
const validateRequest: (
    request: Request // sveltekit RequestEvent.Request
) => Promise<ServerSession>;
```

#### Errors

| name                       | description                                              |
| -------------------------- | -------------------------------------------------------- |
| AUTH_INVALID_ACCESS_TOKEN  | The access token in the authorization headers in invalid |
| AUTH_INVALID_REFRESH_TOKEN | The refresh token in the cookies in invalid              |

#### Example

```ts
// +server.ts
import { auth } from "$lib/server/lucia";
import { getSession } from "lucia-sveltekit/load";
import type { RequestHandler } from "@sveltejs/kit";

export const POST: RequestHandler = async ({ request }) => {
    try {
        const session = await auth.validateRequest(request);
    } catch {
        // ...
    }
};
```

### validateRequestByCookie

Checks if the request was made by an authenticated user using cookies. This can be used in endpoints or server load functions (equivalent to `getSession()`). **Do NOT use this for POST or PUT requests as it is vulnerable to CSRF attacks**, and it will throw an error if it is not a GET request for preventive measures. The request body should not be tampered with (`json()`, `text()`, `formData()`) before calling it.

```ts
const validateRequest: (
    request: Request // sveltekit RequestEvent.Request
) => Promise<ServerSession>;
```

#### Errors

| name                        | description                                              |
| --------------------------- | -------------------------------------------------------- |
| AUTH_INVALID_ACCESS_TOKEN   | The access token in the authorization headers in invalid |
| AUTH_INVALID_REFRESH_TOKEN  | The refresh token in the cookies in invalid              |
| AUTH_INVALID_REQUEST_METHOD | The request method is not "GET"                          |

#### Example

```ts
// +page.server.ts
import { auth } from "$lib/server/lucia";
import type { PageServerLoad } from "./$types";

export const load: PageServerLoad = async ({ request }) => {
    try {
        const session = await auth.validateRequestByCookie(request);
    } catch {
        // ...
    }
};
```

```ts
// +server.ts
import { auth } from "$lib/server/lucia";
import type { RequestHandler } from "@sveltejs/kit";

export const GET: RequestHandler = async ({ request }) => {
    try {
        const session = await auth.validateRequestByCookie(request);
    } catch {
        // ...
    }
};
```
