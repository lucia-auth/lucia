---
_order: 3
title: "`Auth`"
---

Instance returned by [`lucia()`](/reference/lucia-auth/lucia-auth#lucia). Errors can be [`LuciaError`](/reference/lucia-auth/luciaerror) or ones thrown from the database query library.

## `createKey()`

Creates a new non-primary key for a user. **`providerId` cannot include character `:`**.

```ts
const createKey: (
	userId: string,
	keyData:
		| {
				type: "persistent";
				providerId: string;
				providerUserId: string;
				password: string | null;
		  }
		| {
				type: "single_use";
				providerId: string;
				providerUserId: string;
				password: string | null;
				expiresIn: number;
		  }
) => Promise<Key>;
```

#### Parameter

| name                   | type                           | description                                                     |
| ---------------------- | ------------------------------ | --------------------------------------------------------------- |
| userId                 | `string`                       | the user id of the key to create                                |
| keyData.type           | `"persistent" \| "single_use"` | key type                                                        |
| keyData.providerId     | `string`                       | the provider id of the key                                      |
| keyData.providerUserId | `string`                       | the provider user id of the key                                 |
| keyData.password       | `string \| null`               | the password for the key                                        |
| keyData.expiresIn      | `number`                       | single use keys only - how long the key is valid for in seconds |

#### Returns

| type                                     | description           |
| ---------------------------------------- | --------------------- |
| [`Key`](/reference/lucia-auth/types#key) | the newly created key |

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
		type: "persistent",
		providerId: "email",
		providerUserId: "user@example.com",
		password: "123456"
	});
} catch {
	// invalid user id
}
```

```ts
import { auth } from "$lib/server/lucia";
try {
	await auth.createKey(userId, {
		type: "single_use",
		providerId: "email",
		providerUserId: "user@example.com",
		password: null,
		expiresIn: 60 * 60 // 1 hour
	});
} catch {
	// invalid user id
}
```

## `createSession()`

Creates a new session for a user.

```ts
const createSession: (userId: string) => Promise<Session>;
```

#### Parameter

| name   | type     | description                          |
| ------ | -------- | ------------------------------------ |
| userId | `string` | the user id of the session to create |

#### Returns

| type                                             | description               |
| ------------------------------------------------ | ------------------------- |
| [`Session`](/reference/lucia-auth/types#session) | the newly created session |

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

## `createSessionCookie()`

Creates a session in the form of [`Cookie`](/reference/lucia-auth/types#cookie). Cookie options are based on [`sessionCookieOptions`](/basics/configuration#sessioncookieoptions). This method will return a blank session cookie that will override the existing cookie and clears them when provided a `null` session.

```ts
const createSessionCookie: (session: Session | null) => Cookie[];
```

#### Parameter

| name    | type                                             | description |
| ------- | ------------------------------------------------ | ----------- |
| session | [`Session`](/reference/lucia-auth/types#session) |             |

#### Returns

| type                                               | description      |
| -------------------------------------------------- | ---------------- |
| [`Cookie`](/reference/lucia-auth/types#cookie)`[]` | a session cookie |

#### Example

```ts
import { auth } from "./lucia.js";

const sessionCookie = auth.createSessionCookie(session);
const response = new Response(null, {
	headers: {
		"Set-Cookie": sessionCookie.serialize().toString()
	}
});
```

## `createUser()`

Creates a new user, with an option to create a primary key alongside the user.

```ts
const createUser: (data: {
	primaryKey: {
		providerId: string;
		providerUserId: string;
		password: string | null;
	} | null;
	attributes: Lucia.UserAttributes;
}) => Promise<User>;
```

#### Parameter

| name                           | type                                                                 | description                                   |
| ------------------------------ | -------------------------------------------------------------------- | --------------------------------------------- |
| data.primaryKey                | `null` \| `Record<string, any>`                                      |                                               |
| data.primaryKey.providerId     | provider id of the key                                               |                                               |
| data.primaryKey.providerUserId | `string`                                                             | the user id within the provider               |
| data.primaryKey.password       | `string`                                                             | the password for the key                      |
| data.attributes                | [`Lucia.UserAttributes`](/reference/lucia-auth/types#userattributes) | additional user data to store in `user` table |

#### Returns

| type                                       | description            |
| ------------------------------------------ | ---------------------- |
| [`User`](/reference/lucia-auth/types#user) | the newly created user |

#### Errors

| name                  | description                           |
| --------------------- | ------------------------------------- |
| AUTH_DUPLICATE_KEY_ID | the user with the provided key exists |

#### Example

```ts
import { auth } from "$lib/server/lucia";

try {
	await auth.createUser({
		primaryKey: {
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

## `deleteDeadUserSessions()`

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

## `deleteKey()`

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

## `deleteUser()`

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

## `generateSessionId()`

Generates a new session id (40 chars long), as well as the expiration time (unix).

```ts
const generateSessionId: () => [
	sessionId: string,
	activePeriodExpiresAt: Date,
	idlePeriodExpiresAt: Date
];
```

#### Returns

| name                  | type     | description                                        |
| --------------------- | -------- | -------------------------------------------------- |
| sessionId             | `string` | the session id                                     |
| activePeriodExpiresAt | `Date`   | the expiration time of the session's active period |
| idlePeriodExpiresAt   | `Date`   | the expiration time of the session's idle period   |

## `getAllUserKeys()`

Validate the user id and get all keys of a user. Keys returned may be expired.

```ts
const getAllUserKeys: (userId: string) => Promise<Key[]>;
```

#### Parameter

| name   | type     | description             |
| ------ | -------- | ----------------------- |
| userId | `string` | the user id of the user |

#### Returns

| type                                         | description |
| -------------------------------------------- | ----------- |
| [`Key`](/reference/lucia-auth/types#key)`[]` |             |

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

## `getAllUserSessions()`

Validate the user id and get all valid sessions of a user. Includes active and idle sessions, but not dead sessions.

```ts
const getAllUserKeys: (userId: string) => Promise<Session[]>;
```

#### Parameter

| name   | type     | description             |
| ------ | -------- | ----------------------- |
| userId | `string` | the user id of the user |

#### Returns

| type                                             | description |
| ------------------------------------------------ | ----------- |
| [`Session`](/reference/lucia-auth/types#key)`[]` |             |

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

## `getKey()`

Gets the target key. Returns the key even if it's expired, and will not delete the key on read. To validate the key, use [`useKey()](/reference/lucia-auth/auth#usekey) method instead.

```ts
const getKey: (providerId: string, providerUserId: string) => Promise<Key>;
```

#### Parameter

| name           | type     | description                     |
| -------------- | -------- | ------------------------------- |
| providerId     | `string` | the provider id of the key      |
| providerUserId | `string` | the provider user id of the key |

#### Returns

| type                                     | description |
| ---------------------------------------- | ----------- |
| [`Key`](/reference/lucia-auth/types#key) | target key  |

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

## `getSession()`

Gets the target session. Returns both active and idle sessions.

```ts
const getSessionUser: (sessionId: string) => Promise<Session>;
```

#### Parameter

| name      | type     | description               |
| --------- | -------- | ------------------------- |
| sessionId | `string` | a valid active session id |

#### Returns

| type                                             | description                   |
| ------------------------------------------------ | ----------------------------- |
| [`Session`](/reference/lucia-auth/types#session) | the session of the session id |

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

## `getSessionUser()`

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

| name    | type                                             | description                   |
| ------- | ------------------------------------------------ | ----------------------------- |
| session | [`Session`](/reference/lucia-auth/types#session) | the session of the session id |
| user    | [`User`](/reference/lucia-auth/types#user)       | the user of the session       |

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

## `getUser()`

Gets a user.

```ts
const getUser: (userId: string) => Promise<User>;
```

#### Parameter

| name   | type     | description         |
| ------ | -------- | ------------------- |
| userId | `string` | user id of the user |

#### Returns

| type                                       | description               |
| ------------------------------------------ | ------------------------- |
| [`User`](/reference/lucia-auth/types#user) | the user with the user id |

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

## `handleRequest()`

Creates a new [`AuthRequest`](/reference/lucia-auth/authrequest) instance.

```ts
const handleRequest: (...args: Parameters<Middleware>) => AuthRequest;
```

#### Parameters

| type                                                                   | description                             |
| ---------------------------------------------------------------------- | --------------------------------------- |
| `Parameters<`[`Middleware`](/reference/lucia-auth/types#middleware)`>` | Refer to the middleware's documentation |

#### Returns

| type                                               |
| -------------------------------------------------- |
| [`AuthRequest`](/reference/lucia-auth/authrequest) |

### Default middleware

See [Lucia middleware](/reference/lucia-auth/middleware#lucia).

```ts
const handleRequest: (requestContext: RequestContext) => AuthRequest;
```

## `invalidateAllUserSessions()`

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

## `invalidateSession()`

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

## `renewSession()`

Takes and validates an active or idle session id, and renews the session. The used session id (and its session) is invalidated.

Throws an `AUTH_INVALID_SESSION_ID` if a dead session was provided.

```ts
const renewSession: (sessionId: string) => Promise<Session>;
```

#### Parameter

| name      | type     | description                       |
| --------- | -------- | --------------------------------- |
| sessionId | `string` | a valid active or idle session id |

#### Returns

| type                                             | description               |
| ------------------------------------------------ | ------------------------- |
| [`Session`](/reference/lucia-auth/types#session) | the newly created session |

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

## `updateKeyPassword()`

Updates the password of a key.

```ts
const updateKeyPassword: (
	providerId: string,
	providerUserId: string,
	password: string | null
) => Promise<void>;
```

#### Parameter

| name           | type             | description                        |
| -------------- | ---------------- | ---------------------------------- |
| providerId     | `string`         | provider id of the target key      |
| providerUserId | `string`         | provider user id of the target key |
| password       | `string \| null` | new password                       |

#### Errors

| name                | description                          |
| ------------------- | ------------------------------------ |
| AUTH_INVALID_KEY_ID | the user with the key does not exist |

#### Example

```ts
import { auth } from "$lib/server/lucia";

try {
	await auth.updateKeyPassword("email", "user@example.com", "123456");
} catch {
	// invalid credentials
}
```

## `updateUserAttributes()`

Updates one of the custom fields in the `user` table. The keys of `attributes` should include one or more of the additional columns inside `user` table, and the values can be `null` but not `undefined`.

```ts
const updateUserAttributes: (
	userId: string,
	attributes: Partial<Lucia.UserAttributes>
) => Promise<User>;
```

#### Parameter

| name       | type                                                                              | description                                                             |
| ---------- | --------------------------------------------------------------------------------- | ----------------------------------------------------------------------- |
| userId     | `string`                                                                          | A refresh token                                                         |
| attributes | `Partial<`[`Lucia.UserAttributes`](/reference/lucia-auth/types#userattributes)`>` | Key-value pairs of some or all of the column in `user` table to update. |

#### Returns

| type                                       | description      |
| ------------------------------------------ | ---------------- |
| [`User`](/reference/lucia-auth/types#user) | the updated user |

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

## `useKey()`

Validates the key, using the provided password and current time, and throws an error if the key password is incorrect or the key is expired. Will delete single use keys on read, including expired ones.

```ts
const useKey: (
	providerId: string,
	providerUserId: string,
	password: string | null
) => Promise<Key>;
```

#### Parameter

| name           | type             | description                 |
| -------------- | ---------------- | --------------------------- |
| providerId     | `string`         | provider id of the key      |
| providerUserId | `string`         | provider user id of the key |
| password       | `string \| null` | password of the key         |

#### Returns

| type                                     | description       |
| ---------------------------------------- | ----------------- |
| [`Key`](/reference/lucia-auth/types#key) | the validated key |

#### Errors

| name                   | description                                         |
| ---------------------- | --------------------------------------------------- |
| AUTH_INVALID_KEY_ID    | the user with the key does not exist                |
| AUTH_EXPIRED_KEY       | the single use key was expired                      |
| AUTH_INVALID_PASSWORD  | incorrect key password                              |
| AUTH_OUTDATED_PASSWORD | the user's password is hashed with an old algorithm |

#### Example

```ts
import { auth } from "$lib/server/lucia";

try {
	const key = await auth.useKey("email", "user@example.com", "123456");
} catch {
	// invalid credentials
}
```

## `parseRequestHeaders()`

Checks if the request is from a trusted origin if `configuration.csrfProtection` is true, and gets the session id from the cookie. Returns an empty string if none exists.

```ts
const parseRequestHeaders: (request: LuciaRequest) => string;
```

#### Parameter

| name    | type                                                       |
| ------- | ---------------------------------------------------------- |
| request | [`LuciaRequest`](/reference/lucia-auth/types#luciarequest) |

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
	const sessionId = auth.parseRequestHeaders(request);
} catch {
	// request from untrusted domain
}
```

## `transformDatabaseUser()`

Function declared with `transformDatabaseUser()` config.

```ts
const transformDatabaseUser: (
	databaseUser: Required<UserSchema>
) => MaybePromise<User>;
```

#### Parameters

| name         | type                                                                    |
| ------------ | ----------------------------------------------------------------------- |
| databaseUser | `Required<`[`UserSchema`](/reference/lucia-auth/types#sessionschema)`>` |

#### Returns

| type                                       |
| ------------------------------------------ |
| [`User`](/reference/lucia-auth/types#user) |

## `validateSession()`

Validates an active session id, renewing idle sessions if needed. As such, the returned session may not match the input session id and should be stored as a cookie again.

```ts
const validateSession: (sessionId: string) => Promise<Session>;
```

#### Parameter

| name      | type     | description               |
| --------- | -------- | ------------------------- |
| sessionId | `string` | a valid active session id |

#### Returns

| type                                             | description                   |
| ------------------------------------------------ | ----------------------------- |
| [`Session`](/reference/lucia-auth/types#session) | the session of the session id |

#### Errors

| name                    | description               |
| ----------------------- | ------------------------- |
| AUTH_INVALID_SESSION_ID | invalid active session id |

#### Example

```ts
import { auth } from "lucia-auth";

try {
	const session = await auth.validateSession(sessionId);
	if (session.fresh) {
		// session was renewed
		const sessionCookie = auth.createSessionCookie(session).serialize();
		setHeaders("Set-Cookie", sessionCookie);
	}
} catch {
	// invalid
}
```

## `validateSessionUser()`

Similar to [`validateSession()`](/reference/lucia-auth/auth#validatesession) but returns both the session and user without an additional database call.

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

| name    | type                                             | description                   |
| ------- | ------------------------------------------------ | ----------------------------- |
| session | [`Session`](/reference/lucia-auth/types#session) | the session of the session id |
| user    | [`User`](/reference/lucia-auth/types#user)       | the user of the session       |

#### Errors

| name                    | description                                                        |
| ----------------------- | ------------------------------------------------------------------ |
| AUTH_INVALID_SESSION_ID | the value of `auth_session` cookie is an invalid active session id |

#### Example

```ts
import { auth } from "lucia-auth";

try {
	const { session, user } = await auth.validateSessionUser(sessionId);
	if (session.fresh) {
		// session was renewed
		const sessionCookie = auth.createSessionCookie(session).serialize();
		setHeaders("Set-Cookie", sessionCookie);
	}
} catch {
	// invalid
}
```
