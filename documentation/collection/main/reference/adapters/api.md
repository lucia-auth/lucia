---
_order: 1
title: "API"
---

Adapters are just objects with a handful of methods that interact with the database. This makes it easy to create your own and support any databases.

The `adapter` configuration expects a [`AdapterFunction`](/reference/types/lucia-types#adapterfunction), which are functions that takes a [`LuciaError`](/reference/types/lucia-types#luciaerror) constructor as its parameter and returns an adapter object. **`LuciaError` thrown by adapters should use the object passed on and not the one imported from `lucia-auth` package**.

Refer to [Database model](/reference/adapters/database-model) for database model and types.

```ts
// type imported from "lucia-auth/adapter"
type Adapter = {
	getSessionAndUserBySessionId?: (sessionId: string) => Promise<{
		user: UserSchema;
		session: SessionSchema;
	} | null>;
} & UserAdapter &
	SessionAdapter;
```

```ts
type UserAdapter = {
	deleteKeysByUserId: (userId: string) => Promise<void>;
	deleteNonPrimaryKey: (...key: string[]) => Promise<void>;
	deleteUser: (userId: string) => Promise<void>;
	getKey: (keyId: string) => Promise<KeySchema | null>;
	getKeysByUserId: (userId: string) => Promise<KeySchema[]>;
	getUser: (userId: string) => Promise<UserSchema | null>;
	setKey: (key: KeySchema) => Promise<void>;
	setUser: (
		userId: string,
		attributes: Record<string, any>,
		key: KeySchema | null
	) => Promise<UserSchema>;
	updateKeyPassword: (
		key: string,
		hashedPassword: string | null
	) => Promise<void>;
	updateUserAttributes: (
		userId: string,
		attributes: Record<string, any>
	) => Promise<UserSchema>;
};
```

```ts
type SessionAdapter = {
	deleteSession: (...sessionIds: string[]) => Promise<void>;
	deleteSessionsByUserId: (userId: string) => Promise<void>;
	getSession: (sessionId: string) => Promise<SessionSchema | null>;
	getSessionsByUserId: (userId: string) => Promise<SessionSchema[]>;
	setSession: (session: SessionSchema) => Promise<void>;
};
```

The return types must be exactly conform to the documentation.

## `Adapter`

### `getSessionAndUserBySessionId()`

_optional_ - Gets a session (`session` table) and user (`user` table) with the session id. Returns `null` if the session doesn't exist. While this is optional, Lucia will fetch the session and then user if this method is not provided, which may not be the fastest way of getting both user and session.

```ts
const getSessionAndUserBySessionId: (sessionId: string) => Promise<{
	user: UserSchema;
	session: SessionSchema;
} | null>;
```

#### Parameter

| name      | type     | description                  |
| --------- | -------- | ---------------------------- |
| sessionId | `string` | unique target: `session(id)` |

#### Returns

If the session exists

| name    | type                                                                | description                                       |
| ------- | ------------------------------------------------------------------- | ------------------------------------------------- |
| user    | [`UserSchema`](/reference/adapters/database-model#schema-type)      | user data of target: `user(id:session(user_id)`)` |
| session | [`SessionSchema`](/reference/adapters/database-model#schema-type-1) | session data of target                            |

If the session doesn't exist

| type   |
| ------ |
| `null` |

## `UserAdapter`

### `deleteKeysByUserId()`

Deletes all keys with the target user id (`key(user_id)`). Succeeds regardless of the validity of the user id.

```ts
const deleteKeysByUserId: (userId: string) => Promise<void>;
```

#### Parameter

| name   | type     | description            |
| ------ | -------- | ---------------------- |
| userId | `string` | target: `key(user_id)` |

### `deleteNonPrimaryKey()`

Deletes a non-primary (`key(primary) == true`) key with the id. Succeeds regardless of the validity of the id.

```ts
const deleteNonPrimaryKey: (key: string) => Promise<void>;
```

#### Parameter

| name | type  | description              |
| ---- | ----- | ------------------------ |
| key  | `key` | unique target: `key(id)` |

### `deleteUser()`

Deletes a user with the user id (`user(id)`). Succeeds regardless of the validity of the user id.

```ts
const deleteUser: (userId: string) => Promise<void>;
```

#### Parameter

| name   | type     | description               |
| ------ | -------- | ------------------------- |
| userId | `string` | unique target: `user(id)` |

### `getKey()`

Gets a key with the the target id (`key(id)`). Returns `null` is the user doesn't exist.

```ts
const getKey: (keyId: string) => Promise<KeySchema | null>;
```

#### Parameter

| name  | type     | description              |
| ----- | -------- | ------------------------ |
| keyId | `string` | unique target: `key(id)` |

#### Returns

If user exists:

| type                                                            | description        |
| --------------------------------------------------------------- | ------------------ |
| [`KeySchema`](/reference/adapters/database-model#schema-type-2) | key data of target |

If not:

| type   |
| ------ |
| `null` |

### `getKeysByUserId()`

Gets keys with the user id (`key(user_id)`).

```ts
const getKeysByUserId: (userId: string) => Promise<KeySchema[]>;
```

#### Parameter

| name   | type     | description                |
| ------ | -------- | -------------------------- |
| userId | `string` | target: `session(user_id)` |

#### Returns

If session exists:

| type                                                            | description        |
| --------------------------------------------------------------- | ------------------ |
| [`KeySchema`](/reference/adapters/database-model#schema-type-2) | key data of target |

If not:

| type   |
| ------ |
| `null` |

### `getUser()`

Gets a user (`user` table) with the user id. Returns `null` is the user doesn't exist.

```ts
const getUser: (userId: string) => Promise<UserSchema | null>;
```

#### Parameter

| name   | type     | description               |
| ------ | -------- | ------------------------- |
| userId | `string` | unique target: `user(id)` |

#### Returns

If user exists:

| type                                                           | description         |
| -------------------------------------------------------------- | ------------------- |
| [`UserSchema`](/reference/adapters/database-model#schema-type) | User data of target |

If not:

| type   |
| ------ |
| `null` |

### `setKey()`

Creates a new key in `key` table.

```ts
const setKey: (key: KeySchema) => Promise<void>;
```

#### Parameter

| name                | type                  | description                                     |
| ------------------- | --------------------- | ----------------------------------------------- |
| userId              | `string`              | unique target: `user(id)`                       |
| data.providerId     | `string`              | target: `user(provider_id)`                     |
| data.hashedPassword | `string \| null`      | target: `user(hashed_password)`                 |
| data.attributes     | `Record<string, any>` | each key names as [key] - target: `user([key])` |

#### Errors

| type                |
| ------------------- |
| AUTH_INVALID_KEY_ID |

### `setUser()`

Creates a new user in `user` table. Each values of `userAttributes` should be stored in the column of the key name.

This should store the provided `key` if not `null`. It is recommended to use transactions to insert both the user and key, as the user id of the user and key id of the key should be unique for the process to be successful.

```ts
const setUser: (
	userId: string,
	userAttributes: Record<string, any>,
	key: KeySchema | null
) => Promise<UserSchema>;
```

#### Parameter

| name           | type                                                                      | description                                     |
| -------------- | ------------------------------------------------------------------------- | ----------------------------------------------- |
| userId         | `string`                                                                  | unique target: `user(id)`                       |
| userAttributes | `Record<string, any>`                                                     | each key names as [key] - target: `user([key])` |
| key            | [`KeySchema`](/reference/adapters/database-model#schema-type-2) \| `null` | key to store                                    |

#### Returns

| type                                                           | description              |
| -------------------------------------------------------------- | ------------------------ |
| [`UserSchema`](/reference/adapters/database-model#schema-type) | data of the created user |

#### Errors

| type                  |
| --------------------- |
| AUTH_DUPLICATE_KEY_ID |

### `updateKeyPassword()`

Updates a key password `key(hashed_password)` with the key id (`key(id)`).

```ts
const updateKeyPassword: (
	keyId: string,
	hashedPassword: string
) => Promise<void>;
```

#### Parameter

| name           | type     | description                    |
| -------------- | -------- | ------------------------------ |
| keyId          | `string` | unique target: `key(id)`       |
| hashedPassword | `string` | target: `key(hashed_password)` |

#### Errors

| type                  |
| --------------------- |
| AUTH_DUPLICATE_KEY_ID |
| AUTH_INVALID_USER_ID  |

### `updateUserAttributes()`

Updates a user with the user id (`user(id)`).

```ts
const updateUser: (
	userId: string,
	attributes: Partial<Lucia.UserAttributes>
) => Promise<UserSchema>;
```

#### Parameter

| name            | type                   | description               |
| --------------- | ---------------------- | ------------------------- |
| userId          | `string`               | unique target: `user(id)` |
| data.attributes | `Lucia.UserAttributes` | each key/value as column  |

#### Returns

| type                                                           | description              |
| -------------------------------------------------------------- | ------------------------ |
| [`UserSchema`](/reference/adapters/database-model#schema-type) | data of the updated user |

#### Errors

| type                  |
| --------------------- |
| AUTH_DUPLICATE_KEY_ID |
| AUTH_INVALID_USER_ID  |

## `SessionAdapter`

### `deleteSession()`

Deletes a session (`session` table) with the session id. Succeeds regardless of the validity of the session id.

```ts
const deleteSession: (sessionId: string) => Promise<void>;
```

#### Parameter

| name      | type     | description                  |
| --------- | -------- | ---------------------------- |
| sessionId | `string` | unique target: `session(id)` |

### `deleteSessionsByUserId()`

Deletes multiple session (`session` table) with the user id. Succeeds regardless of the validity of the user id.

```ts
const deleteSessionsByUserId: (userId: string) => Promise<void>;
```

#### Parameter

| name   | type     | description                |
| ------ | -------- | -------------------------- |
| userId | `string` | target: `session(user_id)` |

### `getSession()`

Gets a session (`session` table) with the session id.

```ts
const getSession: (sessionId: string) => Promise<SessionSchema | null>;
```

#### Parameter

| name      | type     | description                  |
| --------- | -------- | ---------------------------- |
| sessionId | `string` | unique target: `session(id)` |

#### Returns

If the session exists

| type                                                                | description            |
| ------------------------------------------------------------------- | ---------------------- |
| [`SessionSchema`](/reference/adapters/database-model#schema-type-1) | session data of target |

If the session doesn't exist

| type   |
| ------ |
| `null` |

### `getSessionsByUserId()`

Gets sessions (`session` table`) with the user id.

```ts
const getSessionsByUserId: (userId: string) => Promise<SessionSchema | null>;
```

#### Parameter

| name   | type     | description                |
| ------ | -------- | -------------------------- |
| userId | `string` | target: `session(user_id)` |

#### Returns

If session exists:

| type                                                                | description            |
| ------------------------------------------------------------------- | ---------------------- |
| [`SessionSchema`](/reference/adapters/database-model#schema-type-1) | session data of target |

If not:

| type   |
| ------ |
| `null` |

### `setSession()`

Creates a new session in `session` table.

```ts
const setSession: (session: SessionSchema) => Promise<void>;
```

#### Parameter

| name      | type                                                                | description           |
| --------- | ------------------------------------------------------------------- | --------------------- |
| sessionId | [`SessionSchema`](/reference/adapters/database-model#schema-type-1) | session data to store |

#### Errors

| type                      |
| ------------------------- |
| AUTH_INVALID_USER_ID      |
| AUTH_DUPLICATE_SESSION_ID |
