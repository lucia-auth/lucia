---
_order: 0
title: "API reference"
description: "Learn how to create your own database adapters for Lucia"
---

Adapters provide a set of methods to interact with the database.

### Set up

The value passed onto `adapter` configuration is an adapter function. This function takes in a [`LuciaError`](/reference/lucia-auth/luciaerror). All Lucia specified errors must be thrown as `LuciaError` and must use the one provided as an an argument. It must not use `LuciaError` imported from `lucia-auth`.

```ts
const customAdapter = (adapterOptions: any) => {
	return (luciaError: typeof LuciaError) => ({
		// adapter
	});
};

lucia({
	adapter: customAdapter(options)
});
```

### Schema

Lucia doesn't care how the data is stored, as long as it returns the correct data in the expected shape and that the schema follows certain constraints. Refer to [Database model](/custom-adapters/database-model) for the base model and schema.

## `Adapter`

```ts
type Adapter = {
	getSessionAndUserBySessionId?: (sessionId: string) => Promise<{
		user: UserSchema;
		session: SessionSchema;
	} | null>;
} & UserAdapter &
	SessionAdapter;
```

| type                                                           |
| -------------------------------------------------------------- |
| [`SessionAdapter`](/reference/lucia-auth/types#sessionadapter) |
| [`UserAdapter`](/reference/lucia-auth/types#useradapter)       |

### `getSessionAndUserBySessionId()`

- An adapter may include this method (_optional_ API)
- Must select `auth_session` where `auth_session(id)` equals parameter `sessionId`
- Must select `auth_user` where `auth_user(id)` equals selected `auth_session(user_id)`
- Must return target user and session data, or `null` if neither exists

This is recommended to be included if both the session and the user can be queried in a single database call.

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

If target session exists:

| name    | type                                                                       | description                      |
| ------- | -------------------------------------------------------------------------- | -------------------------------- |
| user    | [`UserSchema`](/reference/lucia-auth/types#sessionschema#schema-type)      | user data of target session data |
| session | [`SessionSchema`](/reference/lucia-auth/types#sessionschema#schema-type-1) | target session data              |

If not:

| type   |
| ------ |
| `null` |

## `SessionAdapter`

```ts
type SessionAdapter = {
	deleteSession: (...sessionIds: string[]) => Promise<void>;
	deleteSessionsByUserId: (userId: string) => Promise<void>;
	getSession: (sessionId: string) => Promise<SessionSchema | null>;
	getSessionsByUserId: (userId: string) => Promise<SessionSchema[]>;
	setSession: (session: SessionSchema) => Promise<void>;
};
```

### `deleteSession()`

- Must delete single `auth_session` where `auth_session(id)` equals parameter `sessionId`
- Must not throw error if parameter `userId` is invalid

```ts
const deleteSession: (sessionId: string) => Promise<void>;
```

#### Parameter

| name      | type     | description                  |
| --------- | -------- | ---------------------------- |
| sessionId | `string` | unique target: `session(id)` |

### `deleteSessionsByUserId()`

- Must delete all `auth_session` where `auth_session(user_id)` equals parameter `userId`
- Must not throw error if parameter `userId` is invalid

```ts
const deleteSessionsByUserId: (userId: string) => Promise<void>;
```

#### Parameter

| name   | type     | description                |
| ------ | -------- | -------------------------- |
| userId | `string` | target: `session(user_id)` |

### `getSession()`

- Must select single `auth_key` where `auth_key(id)` equals parameter `keyId`
- Must return target key data or `null` if target does not exist

```ts
const getSession: (sessionId: string) => Promise<SessionSchema | null>;
```

#### Parameter

| name      | type     | description                  |
| --------- | -------- | ---------------------------- |
| sessionId | `string` | unique target: `session(id)` |

#### Returns

| type                                                                                | description                          |
| ----------------------------------------------------------------------------------- | ------------------------------------ |
| [`SessionSchema`](/reference/lucia-auth/types#sessionschema#schema-type-1)` \| nul` | target session data - `null` if none |

### `getSessionsByUserId()`

- Must select all `auth_key` where `auth_key(user_id)` equals parameter `userId`
- Must return target key data as an array
- Returned array must be empty if no target exists

```ts
const getSessionsByUserId: (userId: string) => Promise<SessionSchema[]>;
```

#### Parameter

| name   | type     | description                |
| ------ | -------- | -------------------------- |
| userId | `string` | target: `session(user_id)` |

#### Returns

| type                                                                           | description                           |
| ------------------------------------------------------------------------------ | ------------------------------------- |
| [`SessionSchema`](/reference/lucia-auth/types#sessionschema#schema-type-1)`[]` | target key data - empty array if none |

### `setSession()`

- Must create new `auth_session`
- Must throw error if `auth_session(user_id)` violates foreign key constraint
- Must throw error if `auth_session(id)` violates unique constraint

```ts
const setSession: (session: SessionSchema) => Promise<void>;
```

#### Parameter

| name      | type                                                                       | description                |
| --------- | -------------------------------------------------------------------------- | -------------------------- |
| sessionId | [`SessionSchema`](/reference/lucia-auth/types#sessionschema#schema-type-1) | set values: `auth_session` |

#### Errors

| type                    | description                                             |
| ----------------------- | ------------------------------------------------------- |
| AUTH_INVALID_SESSION_ID | `auth_session(id)` violates unique constraint           |
| AUTH_INVALID_USER_ID    | `auth_session(user_id)` violates foreign key constraint |

## `UserAdapter`

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
	) => Promise<UserSchema | void>;
	updateKeyPassword: (
		key: string,
		hashedPassword: string | null
	) => Promise<KeySchema | void>;
	updateUserAttributes: (
		userId: string,
		attributes: Record<string, any>
	) => Promise<UserSchema | void>;
};
```

### `deleteKeysByUserId()`

- Must delete all `auth_key` where `auth_key(user_id)` equals parameter `userId`
- Must not throw error if parameter `userId` is invalid

```ts
const deleteKeysByUserId: (userId: string) => Promise<void>;
```

#### Parameter

| name   | type     | description            |
| ------ | -------- | ---------------------- |
| userId | `string` | target: `key(user_id)` |

### `deleteNonPrimaryKey()`

- Must delete single `auth_key` where `auth_key(id)` equals parameter `keyId` and `auth_key(primary_key)` equals `false`
- Must not throw error if parameter `keyId` is invalid

```ts
const deleteNonPrimaryKey: (keyId: string) => Promise<void>;
```

#### Parameter

| name  | type  | description                   |
| ----- | ----- | ----------------------------- |
| keyId | `key` | unique target: `auth_key(id)` |

### `deleteUser()`

- Must delete single `auth_user` where `auth_user(id)` equals parameter `userId`
- Must not throw error if parameter `userId` is invalid

```ts
const deleteUser: (userId: string) => Promise<void>;
```

#### Parameter

| name   | type     | description               |
| ------ | -------- | ------------------------- |
| userId | `string` | unique target: `user(id)` |

### `getKey()`

- Must select single `auth_key` where `auth_key(id)` equals parameter `keyId`
- Must return target key data or `null` if target does not exist

```ts
const getKey: (keyId: string) => Promise<KeySchema | null>;
```

#### Parameter

| name  | type     | description              |
| ----- | -------- | ------------------------ |
| keyId | `string` | unique target: `key(id)` |

#### Returns

| type                                                                             | description                         |
| -------------------------------------------------------------------------------- | ----------------------------------- |
| [`KeySchema`](/reference/lucia-auth/types#sessionschema#schema-type-2)` \| null` | key data of target - `null` if none |

### `getKeysByUserId()`

- Must select all `auth_key` where `auth_key(user_id)` equals parameter `userId`
- Must return target key data as an array
- Returned array must be empty if no target exists

```ts
const getKeysByUserId: (userId: string) => Promise<KeySchema[]>;
```

#### Parameter

| name   | type     | description                 |
| ------ | -------- | --------------------------- |
| userId | `string` | target: `auth_key(user_id)` |

#### Returns

| type                                                                       | description                           |
| -------------------------------------------------------------------------- | ------------------------------------- |
| [`KeySchema`](/reference/lucia-auth/types#sessionschema#schema-type-2)`[]` | target key data - empty array if none |

### `getUser()`

- Must select single `auth_user` where `auth_user(id)` equals parameter `userId`
- Must return target user data or `null` if target does not exist

```ts
const getUser: (userId: string) => Promise<UserSchema | null>;
```

#### Parameter

| name   | type     | description               |
| ------ | -------- | ------------------------- |
| userId | `string` | unique target: `user(id)` |

#### Returns

| type                                                                            | description                       |
| ------------------------------------------------------------------------------- | --------------------------------- |
| [`UserSchema`](/reference/lucia-auth/types#sessionschema#schema-type)` \| null` | target user data - `null` if none |

### `setKey()`

- Must create new `auth_key`
- Must throw error if `auth_key(user_id)` violates foreign key constraint
- Must throw error if `auth_key(id)` violates unique constraint

```ts
const setKey: (key: KeySchema) => Promise<void>;
```

#### Parameter

| name | type                                                                   | description            |
| ---- | ---------------------------------------------------------------------- | ---------------------- |
| key  | [`KeySchema`](/reference/lucia-auth/types#sessionschema#schema-type-2) | set values: `auth_key` |

#### Errors

| type                 | description                                         |
| -------------------- | --------------------------------------------------- |
| AUTH_INVALID_KEY_ID  | `auth_key(id)` violates unique constraint           |
| AUTH_INVALID_USER_ID | `auth_key(user_id)` violates foreign key constraint |

### `setUser()`

- Must create new `auth_user`.
- Must create new `auth_key` if parameter `key` is not `null`.
- Must attempt to remove added `auth_user` if `auth_key` creation errors. Recommended to use transactions or batch queries.
- Must return the newly created user or `void`
- Must throw error if `auth_key(id)` violates unique constraint

```ts
const setUser: (
	userId: string,
	userAttributes: Record<string, any>,
	key: KeySchema | null
) => Promise<UserSchema>;
```

#### Parameter

| name           | type                                                                             | description                                              |
| -------------- | -------------------------------------------------------------------------------- | -------------------------------------------------------- |
| userId         | `string`                                                                         | set value: `auth_user(id)`                               |
| userAttributes | `Record<string, any>`                                                            | set values: each key names as [key] - `auth_user([key])` |
| key            | [`KeySchema`](/reference/lucia-auth/types#sessionschema#schema-type-2) \| `null` | set values if not `null`: `auth_key`                     |

#### Returns

| type                                                                  | description       |
| --------------------------------------------------------------------- | ----------------- |
| [`UserSchema`](/reference/lucia-auth/types#sessionschema#schema-type) | created user data |

#### Errors

| type                  | description                                   |
| --------------------- | --------------------------------------------- |
| AUTH_DUPLICATE_KEY_ID | new `auth_key(id)` violates unique constraint |

### `updateKeyPassword()`

- Must apply update to `auth_key` where `auth_key(id)` equals parameter `keyId`.
- Must update key password `auth_key(hashed_password)` to parameter `hashedPassword`.
- Must return either the updated key data or `void`.
- May throw an error if the key id is invalid.

```ts
const updateKeyPassword: (
	keyId: string,
	hashedPassword: string | null
) => Promise<void>;
```

#### Parameter

| name           | type             | description                          |
| -------------- | ---------------- | ------------------------------------ |
| keyId          | `string`         | unique target: `key(id)`             |
| hashedPassword | `string \| null` | update value: `key(hashed_password)` |

#### Errors

| type                | description                                  |
| ------------------- | -------------------------------------------- |
| AUTH_INVALID_Key_ID | key with the provided user id does not exist |

### `updateUserAttributes()`

- Must apply update to `auth_user` where `auth_user(id)` equals parameter `userId`.
- Must update user attributes defined in `attributes`.
- Must return either the updated user data or `void`.
- May throw an error if the user id is invalid.
- Provided user attributes `attributes` may not contain every property.

```ts
const updateUserAttributes: (
	userId: string,
	attributes: Partial<Lucia.UserAttributes>
) => Promise<UserSchema | void>;
```

#### Parameter

| name            | type                                                                              | description                                              |
| --------------- | --------------------------------------------------------------------------------- | -------------------------------------------------------- |
| userId          | `string`                                                                          | target: `auth_user(id)`                                  |
| data.attributes | `Partial<`[`Lucia.UserAttributes`](/reference/lucia-auth/types#userattributes)`>` | set values: each key names as [key] - `auth_user([key])` |

#### Returns

| type                                                                            | description                           |
| ------------------------------------------------------------------------------- | ------------------------------------- |
| [`UserSchema`](/reference/lucia-auth/types#sessionschema#schema-type)` \| void` | updated user data - `void` if unknown |

#### Errors

| type                 | description                                   |
| -------------------- | --------------------------------------------- |
| AUTH_INVALID_USER_ID | user with the provided user id does not exist |
