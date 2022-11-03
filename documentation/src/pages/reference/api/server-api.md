---
order: 0
layout: "@layouts/DocumentLayout.astro"
title: "Server API"
---

These can be imported from `lucia-auth`. Can only be used inside a server context (.server.ts). The errors list is for Lucia client using official adapters.

```ts
import { generateRandomString } from "lucia-auth";
```

## `generateRandomString()`

Generates a random string of a defined length using [`nanoid`](https://github.com/ai/nanoid). The output is cryptographically random.

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

## `lucia()` (default)

Creates a new `Auth` instance. Methods for `Auth` can throw adapter-specific database errors. The methods for the instance are listed below.

```ts
const lucia: (configs: Configurations) => Auth;
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
const authenticateUser: (provider: string, identifier: string, password: string) => Promise<User>;
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

#### Example

```ts
import { auth } from "$lib/server/lucia";

try {
	await auth.authenticateUser("email", "user@example.com", "123456");
} catch {
	// invalid credentials
}
```

### `createBlankSessionCookies()`

Creates an array of stringified cookies that will remove existing session cookies when set. Cookie options are based on [`deleteCookieOptions`](/reference/configure/lucia-configurations#deletecookieoptions).

```ts
const createBlankSessionCookies: () => string[];
```

#### Returns

| type       | description                     |
| ---------- | ------------------------------- |
| `string[]` | An array of stringified cookies |

#### Example

```ts
import { auth } from "./lucia.js";

const cookies = auth.createBlankSessionCookies(session);
const response = new Response(null, {
	headers: {
		"Set-Cookie": cookies.join()
	}
});
```

### `createSession()`

Creates a new session of a user.

```ts
const createSession: (userId: string) => Promise<Session>;
```

#### Parameter

| name   | type     | description                          |
| ------ | -------- | ------------------------------------ |
| userId | `string` | The user id of the session to create |

#### Returns

| type                                              | description               |
| ------------------------------------------------- | ------------------------- |
| [`Session`](/reference/types/lucia-types#session) | The newly created session |

#### Errors

| name                 | description     |
| -------------------- | --------------- |
| AUTH_INVALID_USER_ID | Invalid user id |

#### Example

```ts
import { auth } from "$lib/server/lucia";
try {
	await auth.createSession(userId);
} catch {
	// invalid user id
}
```

### `createSessionCookies()`

Creates an array of stringified session cookies. Cookie options are based on [`sessionCookieOptions`](/reference/configure/lucia-configurations#sessioncookieoptions).

```ts
const createSessionCookies: (session: Session) => string[];
```

#### Parameter

| name    | type                                              | description |
| ------- | ------------------------------------------------- | ----------- |
| session | [`Session`](/reference/types/lucia-types#session) |             |

#### Returns

| type       | description                             |
| ---------- | --------------------------------------- |
| `string[]` | An array of stringified session cookies |

#### Example

```ts
import { auth } from "./lucia.js";

const cookies = auth.createSessionCookies(session);
const response = new Response(null, {
	headers: {
		"Set-Cookie": cookies.join()
	}
});
```

### `createUser()`

Creates a new user.

```ts
const createUser: (
	provider: string,
	identifier: string,
	options?: {
		password?: string;
		attributes?: Lucia.UserAttributes;
	}
) => Promise<User>;
```

#### Parameter

| name               | type                                                                      | description                                             | optional |
| ------------------ | ------------------------------------------------------------------------- | ------------------------------------------------------- | -------- |
| provider           | `string`                                                                  | The provider of the user to create                      |          |
| identifier         | `string`                                                                  | The identifier of the user˝ to create                   |          |
| options.password   | `string`                                                                  | The password of the user - can be undefined to omit it. | true     |
| options.attributes | [`Lucia.UserAttributes`](/reference/types/lucia-namespace#userattributes) | Additional user data to store in `user` table           | true     |

#### Returns

| type                                        | description            |
| ------------------------------------------- | ---------------------- |
| [`User`](/reference/types/lucia-types#user) | The newly created user |

#### Errors

| name                       | description                                      |
| -------------------------- | ------------------------------------------------ |
| AUTH_DUPLICATE_PROVIDER_ID | The user with the provider and identifier exists |

#### Example

```ts
import { auth } from "$lib/server/lucia";

try {
	await auth.createUser("email", "user@example.com", {
		password: "123456",
		attributes: {
			username: "user123",
			isAdmin: true
		}
	});
} catch {
	// error
}
```

### `deleteDeadUserSessions()`

Deletes all sessions that are expired and their idle period has passed (dead sessions). Will succeed regardless of the validity of the user id.

```ts
const deleteDeadUserSessions: (userId: string) => Promise<void>;
```

#### Parameter

| name   | type     | description         |
| ------ | -------- | ------------------- |
| userId | `string` | User id of the user |

#### Example

```ts
import { auth } from "lucia-auth";

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

#### Example

```ts
import { auth } from "$lib/server/lucia";

try {
	await auth.deleteUser(userId);
} catch {
	// error
}
```

### `generateSessionId()`

Generates a new session id (40 chars long), as well as the expiration time (unix).

```ts
const generateSessionId: () => [string, number, number];
```

#### Returns

| name | type     | description                                             |
| ---- | -------- | ------------------------------------------------------- |
| [0]  | `string` | The session id                                          |
| [1]  | `number` | The session's expiration time                           |
| [2]  | `number` | The expiration time (unix) of the session's idle period |

### `getSessionUser()`

Validates an active session id, and gets the session and the user in one database call.

```ts
const getSessionUser: (sessionId: string) => Promise<{ user: User; session: Session }>;
```

#### Parameter

| name      | type     | description               |
| --------- | -------- | ------------------------- |
| sessionId | `string` | A valid active session id |

#### Returns

| name    | type                                              | description                   |
| ------- | ------------------------------------------------- | ----------------------------- |
| session | [`Session`](/reference/types/lucia-types#session) | The session of the session id |
| user    | [`User`](/reference/types/lucia-types#user)       | The user of the session       |

#### Errors

| name                    | description               |
| ----------------------- | ------------------------- |
| AUTH_INVALID_SESSION_ID | A valid active session id |

#### Example

```ts
import { auth } from "$lib/server/lucia";

try {
	await auth.getSessionUser(sessionId);
} catch {
	// invalid session id
}
```

### `getSessionUserFromRequest()`

Similar to [`validateRequest()`](/reference/api/server-api#validaterequest) but returns both the session and user without an additional database call.

```ts
const validateRequest: (
	request: MinimalRequest,
	setCookie: (stringifiedCookie) => void
) => Promise<{ user: User; session: Session }>;
```

#### Parameter

| name      | type                                                            | description                                                                                       |
| --------- | --------------------------------------------------------------- | ------------------------------------------------------------------------------------------------- |
| request   | [`MinimalRequest`](/reference/types/lucia-types#minimalrequest) | the fetch [`Request`](https://developer.mozilla.org/en-US/docs/Web/API/Request) can be used as is |
| setCookie | `Function`                                                      |                                                                                                   |

#### Returns

| name    | type                                              | description                   |
| ------- | ------------------------------------------------- | ----------------------------- |
| session | [`Session`](/reference/types/lucia-types#session) | The session of the session id |
| user    | [`User`](/reference/types/lucia-types#user)       | The user of the session       |

#### Errors

| name                    | description                                                        |
| ----------------------- | ------------------------------------------------------------------ |
| AUTH_INVALID_REQUEST    | The request is not from a trusted origin                           |
| AUTH_INVALID_SESSION_ID | The value of `auth_session` cookie is an invalid active session id |

#### Example

```ts
import { auth } from "lucia-auth";

try {
	let sessionCookie = "";
	const { session, user } = await auth.validateRequest(request, (stringifiedCookie) => {
		sessionCookie = stringifiedCookie;
	});
	const response = new Response();
	response.headers.append("set-cookie", sessionCookie);
} catch {
	// invalid
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

| name                 | description                              |
| -------------------- | ---------------------------------------- |
| AUTH_INVALID_USER_ID | The user with the user id does not exist |

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
const getUserByProviderId: (provider: string, identifier: string) => Promise<User>;
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

#### Example

```ts
import { auth } from "$lib/server/lucia";

try {
	await auth.getUserByProviderId("email", "user@example.com");
} catch {
	// invalid provider id
}
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

Invalidates a session. Will succeed regardless of the validity of the session id.

```ts
const invalidateSession: (sessionId: string) => Promise<void>;
```

#### Parameter

| name      | type     | description  |
| --------- | -------- | ------------ |
| sessionId | `string` | A session id |

#### Example

```ts
import { auth } from "lucia-auth";

try {
	await auth.invalidateSession(sessionId);
} catch {
	// error
}
```

### `parseRequest()`

Checks if the request is from a trusted origin if `configuration.csrfProtection` is true, and gets the session id from the cookie. Returns an empty string if none exists. This does **NOT** check the validity of the session id.

```ts
const parseRequest: (request: MinimalRequest) => string;
```

#### Parameter

| name    | type                                                            | description                  |
| ------- | --------------------------------------------------------------- | ---------------------------- |
| request | [`MinimalRequest`](/reference/types/lucia-types#minimalrequest) | Node's `Request` can be used |

#### Returns

| type     | description                         |
| -------- | ----------------------------------- |
| `string` | The session id read from the cookie |

#### Errors

| name                 | description                              |
| -------------------- | ---------------------------------------- |
| AUTH_INVALID_REQUEST | The request is not from a trusted origin |

#### Example

```ts
try {
	const sessionId = auth.parseRequest(request);
} catch {
	// request from untrusted domain
}
```

### `renewSession()`

Takes and validates an active or idle session id, and renews the session. The used session id (and its session) is invalidated.

```ts
const renewSession: (sessionId: string) => Promise<Session>;
```

#### Parameter

| name      | type     | description                       |
| --------- | -------- | --------------------------------- |
| sessionId | `string` | A valid active or idle session id |

#### Returns

| type                                              | description               |
| ------------------------------------------------- | ------------------------- |
| [`Session`](/reference/types/lucia-types#session) | The newly created session |

#### Errors

| name                    | description        |
| ----------------------- | ------------------ |
| AUTH_INVALID_SESSION_ID | Invalid session id |

#### Example

```ts
import { auth } from "lucia-auth";

try {
	const session = await auth.renewSession(refreshToken);
} catch {
	// error
}
```

### `updateUserAttributes()`

Updates one of the custom fields in the `user` table. The keys of `attributes` should include one or more of the additional columns inside `user` table, and the values can be `null` but not `undefined`.

```ts
const updateUserAttributes: (
	userId: string,
	attributes: Partial<Lucia.UserAttributes>
) => Promise<User>;
```

#### Parameter

| name       | type                                                                                   | description                                                             |
| ---------- | -------------------------------------------------------------------------------------- | ----------------------------------------------------------------------- |
| userId     | `string`                                                                               | A refresh token                                                         |
| attributes | `Partial<`[`Lucia.UserAttributes`](/reference/types/lucia-namespace#userattributes)`>` | Key-value pairs of some or all of the column in `user` table to update. |

#### Returns

| type                                        | description      |
| ------------------------------------------- | ---------------- |
| [`User`](/reference/types/lucia-types#user) | The updated user |

#### Errors

| name                 | description           |
| -------------------- | --------------------- |
| AUTH_INVALID_USER_ID | Invalid refresh token |

#### Example

```ts
import { auth } from "lucia-auth";

try {
	await auth.updateUserAttributes(userId, {
		username: "user123"
	});
} catch {
	// error
}
```

### `updateUserPassword()`

Updates a user's password.

```ts
const updateUserPassword: (userId: string, password: string | null) => Promise<User>;
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

| name                 | description           |
| -------------------- | --------------------- |
| AUTH_INVALID_USER_ID | Invalid refresh token |

#### Example

```ts
import { auth } from "lucia-auth";

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
const updateUserProviderId: (userId: string, provider: string, identifier: string) => Promise<User>;
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

| name                 | description           |
| -------------------- | --------------------- |
| AUTH_INVALID_USER_ID | Invalid refresh token |

#### Example

```ts
import { auth } from "lucia-auth";

try {
	await auth.updateUserProviderId(userId, "email", "user@example.com");
} catch {
	// error
}
```

### `validateRequest()`

Checks if the request is from a trusted domain, and if so, validates the session id stored inside `auth_session` cookie. If the session is invalid, it attempts to renew the session. `setCookie()` will called whenever the method needs to set a cookie. The input is the value of the `set-cookie` headers and the function should append it to the header.

```ts
const validateRequest: (
	request: MinimalRequest,
	setCookie: (stringifiedCookie) => void
) => Promise<Session>;
```

#### Parameter

| name      | type                                                            | description                                                                                       |
| --------- | --------------------------------------------------------------- | ------------------------------------------------------------------------------------------------- |
| request   | [`MinimalRequest`](/reference/types/lucia-types#minimalrequest) | the fetch [`Request`](https://developer.mozilla.org/en-US/docs/Web/API/Request) can be used as is |
| setCookie | `Function`                                                      |                                                                                                   |

#### Returns

| type                                              | description                   |
| ------------------------------------------------- | ----------------------------- |
| [`Session`](/reference/types/lucia-types#session) | The session of the session id |

#### Errors

| name                    | description                                                        |
| ----------------------- | ------------------------------------------------------------------ |
| AUTH_INVALID_REQUEST    | The request is not from a trusted origin                           |
| AUTH_INVALID_SESSION_ID | The value of `auth_session` cookie is an invalid active session id |

#### Example

```ts
import { auth } from "lucia-auth";

try {
	let sessionCookie = "";
	const session = await auth.validateRequest(request, (stringifiedCookie) => {
		sessionCookie = stringifiedCookie;
	});
	const response = new Response();
	response.headers.append("set-cookie", sessionCookie);
} catch {
	// invalid
}
```

### `validateSession()`

Validates an active session id. Idle sessions are considered invalid.

```ts
const validateSession: (sessionId: string) => Promise<Session>;
```

#### Parameter

| name      | type     | description               |
| --------- | -------- | ------------------------- |
| sessionId | `string` | A valid active session id |

#### Returns

| type                                              | description                   |
| ------------------------------------------------- | ----------------------------- |
| [`Session`](/reference/types/lucia-types#session) | The session of the session id |

#### Errors

| name                    | description               |
| ----------------------- | ------------------------- |
| AUTH_INVALID_SESSION_ID | Invalid active session id |

#### Example

```ts
import { auth } from "lucia-auth";

try {
	const session = await auth.validateSession(sessionId);
} catch {
	// invalid
}
```

## `LuciaError`

Refer to [Error reference](/reference/types/errors).

```ts
class LuciaError extends Error
```
