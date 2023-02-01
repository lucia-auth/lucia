---
_order: 0
title: "Server API"
---

These can be imported from `lucia-auth`. Can only be used inside a server context. The errors list is for Lucia instances using official adapters.

```ts
import { generateRandomString } from "lucia-auth";
```

## `generateRandomString()`

Generates a random string of a defined length using [`nanoid`](https://github.com/ai/nanoid). The output is cryptographically random.

```ts
const generateRandomString: (length: number) => string;
```

Uses the following characters (uppercase, lowercase, numbers):

```
0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz
```

#### Parameter

| name   | type     | description                     |
| ------ | -------- | ------------------------------- |
| length | `number` | the length of the output string |

#### Returns

| type     | description                 |
| -------- | --------------------------- |
| `string` | a randomly generated string |

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
| configs | `Configurations` | options for Lucia - refer to [Lucia configurations](/reference/configurations/lucia-configurations) |

#### Example

```ts
const auth = lucia(configs);
```

### `createKey()`

Creates a new non-primary key for a user.

```ts
const createKey: (
	userId: string,
	data: {
		providerId: string;
		providerUserId: string;
		password: string | null;
	}
) => Promise<Key>;
```

#### Parameter

| name                | type     | description                                                                                                              |
| ------------------- | -------- | ------------------------------------------------------------------------------------------------------------------------ |
| userId              | `string` | the user id of the key to create                                                                                         |
| data.providerId     | `string` | the provider id of the key                                                                                               |
| data.providerUserId | `string` | the provider user id of the key                                                                                          |
| data.password       | `string` | the password for the key - can be validated using [`validateKeyPassword`](/reference/api/server-api#validatekeypassword) |

#### Returns

| type                                      | description           |
| ----------------------------------------- | --------------------- |
| [`Key`](/reference/types/lucia-types#key) | the newly created key |

#### Errors

| name                  | description        |
| --------------------- | ------------------ |
| AUTH_INVALID_USER_ID  | invalid user id    |
| AUTH_DUPLICATE_KEY_ID | key already exists |

#### Example

```ts
import { auth } from "$lib/server/lucia";
try {
	await auth.createKey(userId, {
		providerId: "email",
		providerUserId: "user@example.com",
		password: "123456"
	});
} catch {
	// invalid user id
}
```

### `createSession()`

Creates a new session for a user.

```ts
const createSession: (userId: string) => Promise<Session>;
```

#### Parameter

| name   | type     | description                          |
| ------ | -------- | ------------------------------------ |
| userId | `string` | the user id of the session to create |

#### Returns

| type                                              | description               |
| ------------------------------------------------- | ------------------------- |
| [`Session`](/reference/types/lucia-types#session) | the newly created session |

#### Errors

| name                 | description     |
| -------------------- | --------------- |
| AUTH_INVALID_USER_ID | invalid user id |

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

Creates an array of session cookies in the form of [`Cookie`](/reference/types/lucia-types#cookie). Cookie options are based on [`sessionCookieOptions`](/reference/configure/lucia-configurations#sessioncookieoptions). This method will return a blank session cookies that will override the existing cookie and clears them when provided a `null` session.

```ts
const createSessionCookies: (session: Session | null) => Cookie[];
```

#### Parameter

| name    | type                                              | description |
| ------- | ------------------------------------------------- | ----------- |
| session | [`Session`](/reference/types/lucia-types#session) |             |

#### Returns

| type                                                | description                 |
| --------------------------------------------------- | --------------------------- |
| [`Cookie`](/reference/types/lucia-types#cookie)`[]` | an array of session cookies |

#### Example

```ts
import { auth } from "./lucia.js";

const cookies = auth.createSessionCookies(session);
const response = new Response(null, {
	headers: {
		"Set-Cookie": cookies.map((val) => val.serialize()).toString()
	}
});
```

### `createUser()`

Creates a new user and a new primary key.

```ts
const createUser: (data: {
	key: {
		providerId: string;
		providerUserId: string;
		password: string | null;
	} | null;
	attributes: Lucia.UserAttributes;
}) => Promise<User>;
```

#### Parameter

| name                    | type                                                                                     | description                                   | optional |
| ----------------------- | ---------------------------------------------------------------------------------------- | --------------------------------------------- | -------- |
| data.key                | `null` \| `typeof data.key`                                                              |
| data.key.providerId     | provider id of the key                                                                   |
| data.key.providerUserId | `string`                                                                                 | the user id within the provider               |
| data.key.password       | `string`                                                                                 | the password for the key                      | true     |
| data.attributes         | [`Lucia.UserAttributes`](/reference/types/lucia-namespace#userattributes)` \| undefined` | additional user data to store in `user` table | true     |

#### Returns

| type                                        | description            |
| ------------------------------------------- | ---------------------- |
| [`User`](/reference/types/lucia-types#user) | the newly created user |

#### Errors

| name                  | description                           |
| --------------------- | ------------------------------------- |
| AUTH_DUPLICATE_KEY_ID | the user with the provided key exists |

#### Example

```ts
import { auth } from "$lib/server/lucia";

try {
	await auth.createUser({
		key: {
			providerId: "email",
			providerUserId: "user@example.com",
			password: "123456"
		},
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
| userId | `string` | user id of the user |

#### Example

```ts
import { auth } from "lucia-auth";

try {
	await auth.deleteExpiredUserSession(userId);
} catch {
	// error
}
```

### `deleteKey()`

Deletes a non-primary key. Primary keys can't be deleted.

```ts
const deleteKey: (providerId: string, providerUserId: string) => Promise<void>;
```

#### Parameter

| name           | type     | description                     |
| -------------- | -------- | ------------------------------- |
| providerId     | `string` | the provider id of the key      |
| providerUserId | `string` | the provider user id of the key |

#### Example

```ts
import { auth } from "lucia-auth";

try {
	await auth.deleteKey("username", "user@example.com");
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
| userId | `string` | user id of the user to delete |

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
const generateSessionId: () => [
	sessionId: string,
	activePeriodExpires: Date,
	idlePeriodExpires: Date
];
```

#### Returns

| name                | type     | description                                        |
| ------------------- | -------- | -------------------------------------------------- |
| sessionId           | `string` | the session id                                     |
| activePeriodExpires | `Date`   | the expiration time of the session's active period |
| idlePeriodExpires   | `Date`   | the expiration time of the session's idle period   |

### `getAllUserKeys()`

Validate the user id and get all keys of a user.

```ts
const getAllUserKeys: (userId: string) => Promise<Key[]>;
```

#### Parameter

| name   | type     | description             |
| ------ | -------- | ----------------------- |
| userId | `string` | the user id of the user |

#### Returns

| type                                          | description |
| --------------------------------------------- | ----------- |
| [`Key`](/reference/types/lucia-types#key)`[]` |             |

#### Errors

| name                 | description                              |
| -------------------- | ---------------------------------------- |
| AUTH_INVALID_USER_ID | the user with the user id does not exist |

#### Example

```ts
import { auth } from "$lib/server/lucia";

try {
	const keys = await auth.getAllUserKeys(userId);
} catch {
	// invalid user id
}
```

### `getAllUserSessions()`

Validate the user id and get all sessions of a user.

```ts
const getAllUserKeys: (userId: string) => Promise<Session[]>;
```

#### Parameter

| name   | type     | description             |
| ------ | -------- | ----------------------- |
| userId | `string` | the user id of the user |

#### Returns

| type                                              | description |
| ------------------------------------------------- | ----------- |
| [`Session`](/reference/types/lucia-types#key)`[]` |             |

#### Errors

| name                 | description                              |
| -------------------- | ---------------------------------------- |
| AUTH_INVALID_USER_ID | the user with the user id does not exist |

#### Example

```ts
import { auth } from "$lib/server/lucia";

try {
	const sessions = await auth.getAllUserSessions(userId);
} catch {
	// invalid user id
}
```

### `getKey()`

Gets the target key.

```ts
const getKey: (providerId: string, providerUserId: string) => Promise<Key>;
```

#### Parameter

| name           | type     | description                     |
| -------------- | -------- | ------------------------------- |
| providerId     | `string` | the provider id of the key      |
| providerUserId | `string` | the provider user id of the key |

#### Returns

| type                                      | description |
| ----------------------------------------- | ----------- |
| [`Key`](/reference/types/lucia-types#key) | target key  |

#### Errors

| name                | description                                  |
| ------------------- | -------------------------------------------- |
| AUTH_INVALID_KEY_ID | the user with the provider id does not exist |

#### Example

```ts
import { auth } from "$lib/server/lucia";

try {
	const key = await auth.getKey("email", "user@example.com");
} catch {
	// invalid key
}
```

### `getKeyUser()`

Gets the target key and the user of the key.

```ts
const getKey: (
	providerId: string,
	providerUserId: string
) => Promise<{
	key: Key;
	user: User;
}>;
```

#### Parameter

| name           | type     | description                     |
| -------------- | -------- | ------------------------------- |
| providerId     | `string` | the provider id of the key      |
| providerUserId | `string` | the provider user id of the key |

#### Returns

| name | type                                        | description         |
| ---- | ------------------------------------------- | ------------------- |
| key  | [`Key`](/reference/types/lucia-types#key)   | the target key      |
| user | [`User`](/reference/types/lucia-types#user) | the user of the key |

#### Errors

| name                | description                                  |
| ------------------- | -------------------------------------------- |
| AUTH_INVALID_KEY_ID | the user with the provider id does not exist |
| AUTH_INVALID_USER   |                                              |

#### Example

```ts
import { auth } from "$lib/server/lucia";

try {
	const { key, user } = await auth.getKeyUser("email", "user@example.com");
} catch {
	// invalid key
}
```

### `getSession()`

Gets the target session. Returns both active and idle sessions.

```ts
const getSessionUser: (sessionId: string) => Promise<Session>;
```

#### Parameter

| name      | type     | description               |
| --------- | -------- | ------------------------- |
| sessionId | `string` | a valid active session id |

#### Returns

| type                                              | description                   |
| ------------------------------------------------- | ----------------------------- |
| [`Session`](/reference/types/lucia-types#session) | the session of the session id |

#### Errors

| name                    | description               |
| ----------------------- | ------------------------- |
| AUTH_INVALID_SESSION_ID | a valid active session id |

#### Example

```ts
import { auth } from "$lib/server/lucia";

try {
	const session = await auth.getSession(sessionId);
	if (session.state === "active") {
		// valid session
	}
	if (session.state === "idle") {
		// should be renewed
	}
} catch {
	// invalid session id
}
```

### `getSessionUser()`

Validates an active session id, and gets the session and the user in one database call. Idle sessions are not renewed and are not deemed invalid.

```ts
const getSessionUser: (
	sessionId: string
) => Promise<{ user: User; session: Session }>;
```

#### Parameter

| name      | type     | description               |
| --------- | -------- | ------------------------- |
| sessionId | `string` | a valid active session id |

#### Returns

| name    | type                                              | description                   |
| ------- | ------------------------------------------------- | ----------------------------- |
| session | [`Session`](/reference/types/lucia-types#session) | the session of the session id |
| user    | [`User`](/reference/types/lucia-types#user)       | the user of the session       |

#### Errors

| name                    | description               |
| ----------------------- | ------------------------- |
| AUTH_INVALID_SESSION_ID | a valid active session id |

#### Example

```ts
import { auth } from "$lib/server/lucia";

try {
	const { session, user } = await auth.getSessionUser(sessionId);
} catch {
	// invalid session id
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
| userId | `string` | user id of the user |

#### Returns

| type                                        | description               |
| ------------------------------------------- | ------------------------- |
| [`User`](/reference/types/lucia-types#user) | the user with the user id |

#### Errors

| name                 | description                              |
| -------------------- | ---------------------------------------- |
| AUTH_INVALID_USER_ID | the user with the user id does not exist |

#### Example

```ts
import { auth } from "$lib/server/lucia";

try {
	await auth.getUser(userId);
} catch {
	// invalid user id
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
| userId | `string` | user id of the user |

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
| sessionId | `string` | a session id |

#### Example

```ts
import { auth } from "lucia-auth";

try {
	await auth.invalidateSession(sessionId);
} catch {
	// error
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
| sessionId | `string` | a valid active or idle session id |

#### Returns

| type                                              | description               |
| ------------------------------------------------- | ------------------------- |
| [`Session`](/reference/types/lucia-types#session) | the newly created session |

#### Errors

| name                    | description        |
| ----------------------- | ------------------ |
| AUTH_INVALID_SESSION_ID | invalid session id |

#### Example

```ts
import { auth } from "lucia-auth";

try {
	const renewedSession = await auth.renewSession(session.sessionId);
} catch {
	// error
}
```

### `updateKeyPassword()`

Update key password.

```ts
const updateKeyPassword: (
	providerId: string,
	providerUserId: string,
	password: string | null
) => Promise<void>;
```

#### Parameter

| name           | type     | description                        |
| -------------- | -------- | ---------------------------------- |
| providerId     | `string` | provider id of the target key      |
| providerUserId | `string` | provider user id of the target key |
| password       | `string` | new password                       |

#### Errors

| name                   | description                                         |
| ---------------------- | --------------------------------------------------- |
| AUTH_INVALID_KEY_ID    | the user with the key does not exist                |
| AUTH_INVALID_PASSWORD  | incorrect password                                  |
| AUTH_OUTDATED_PASSWORD | the user's password is hashed with an old algorithm |

#### Example

```ts
import { auth } from "$lib/server/lucia";

try {
	await auth.validateKeyPassword("email", "user@example.com", "123456");
} catch {
	// invalid credentials
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
| [`User`](/reference/types/lucia-types#user) | the updated user |

#### Errors

| name                 | description           |
| -------------------- | --------------------- |
| AUTH_INVALID_USER_ID | invalid refresh token |

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

### `validateKeyPassword()`

Validates the password of a key. Can only be used if the password is defined.

```ts
const validateKeyPassword: (
	providerId: string,
	providerUserId: string,
	password: string
) => Promise<User>;
```

#### Parameter

| name           | type     | description                 |
| -------------- | -------- | --------------------------- |
| providerId     | `string` | provider id of the key      |
| providerUserId | `string` | provider user id of the key |
| password       | `string` | password of the key         |

#### Returns

| type                                        | description        |
| ------------------------------------------- | ------------------ |
| [`User`](/reference/types/lucia-types#user) | the validated user |

#### Errors

| name                   | description                                         |
| ---------------------- | --------------------------------------------------- |
| AUTH_INVALID_KEY_ID    | the user with the key does not exist                |
| AUTH_INVALID_PASSWORD  | incorrect password                                  |
| AUTH_OUTDATED_PASSWORD | the user's password is hashed with an old algorithm |

#### Example

```ts
import { auth } from "$lib/server/lucia";

try {
	await auth.validateKeyPassword("email", "user@example.com", "123456");
} catch {
	// invalid credentials
}
```

### `validateRequestHeaders()`

Checks if the request is from a trusted origin if `configuration.csrfProtection` is true, and gets the session id from the cookie. Returns an empty string if none exists.

```ts
const validateRequestHeaders: (request: MinimalRequest) => string;
```

#### Parameter

| name    | type                                                            | description                  |
| ------- | --------------------------------------------------------------- | ---------------------------- |
| request | [`MinimalRequest`](/reference/types/lucia-types#minimalrequest) | Node's `Request` can be used |

#### Returns

| type     | description                         |
| -------- | ----------------------------------- |
| `string` | the session id read from the cookie |

#### Errors

| name                 | description                              |
| -------------------- | ---------------------------------------- |
| AUTH_INVALID_REQUEST | the request is not from a trusted origin |

#### Example

```ts
try {
	const sessionId = auth.validateRequestHeaders(request);
} catch {
	// request from untrusted domain
}
```

### `validateSession()`

Validates an active session id, renewing idle sessions if needed. As such, the returned session may not match the input session id and should be stored as a cookie again.

```ts
const validateSession: (sessionId: string) => Promise<Session>;
```

#### Parameter

| name      | type     | description               |
| --------- | -------- | ------------------------- |
| sessionId | `string` | a valid active session id |

#### Returns

| type                                              | description                   |
| ------------------------------------------------- | ----------------------------- |
| [`Session`](/reference/types/lucia-types#session) | the session of the session id |

#### Errors

| name                    | description               |
| ----------------------- | ------------------------- |
| AUTH_INVALID_SESSION_ID | invalid active session id |

#### Example

```ts
import { auth } from "lucia-auth";

try {
	const session = await auth.validateSession(sessionId);
	if (session.isFresh) {
		// session was renewed
		const stringifiedCookie = auth
			.createSessionCookies(session)
			.map((val) => val.serialize())
			.toString();
		setHeaders("set-cookie", stringifiedCookie);
	}
} catch {
	// invalid
}
```

### `validateSessionUser()`

Similar to [`validateSession()`](/reference/api/server-api#validatesession) but returns both the session and user without an additional database call.

```ts
const validateSessionUser: (
	sessionId: string
) => Promise<{ user: User; session: Session }>;
```

#### Parameter

| name      | type     | description |
| --------- | -------- | ----------- |
| sessionId | `string` | session id  |

#### Returns

| name    | type                                              | description                   |
| ------- | ------------------------------------------------- | ----------------------------- |
| session | [`Session`](/reference/types/lucia-types#session) | the session of the session id |
| user    | [`User`](/reference/types/lucia-types#user)       | the user of the session       |

#### Errors

| name                    | description                                                        |
| ----------------------- | ------------------------------------------------------------------ |
| AUTH_INVALID_SESSION_ID | the value of `auth_session` cookie is an invalid active session id |

#### Example

```ts
import { auth } from "lucia-auth";

try {
	const { session, user } = await auth.validateSessionUser(sessionId);
	if (session.isFresh) {
		// session was renewed
		const stringifiedCookie = auth
			.createSessionCookies(session)
			.map((val) => val.serialize())
			.toString();
		setHeaders("set-cookie", stringifiedCookie);
	}
} catch {
	// invalid
}
```

## `LuciaError`

Refer to [Error reference](/reference/types/errors).

```ts
class LuciaError extends Error {}
```

## `SESSION_COOKIE_NAME` (constant)

The name of the session cookie.

```ts
const SESSION_COOKIE_NAME: string;
```
