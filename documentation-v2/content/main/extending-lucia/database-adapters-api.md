---
order: 0
title: "Database adapters API"
description: "Learn how to build your own database adapters"
---

### Errors

Errors defined in the specification, such as `AUTH_INVALID_USER_ID` must be thrown as a [`LuciaError`](/reference/lucia/main#luciaerror).

```ts
throw new LuciaError("AUTH_INVALID_USER_ID");
```

## `InitializeAdapter`

`adapter` configuration takes a `InitializeAdapter` function, which in turn returns the actual adapter instance. This function takes a `LuciaError`, and all errors thrown by the adapter must use this class instead of the one imported from `lucia`.

```ts
const customAdapter = (config: any) => {
	return (luciaError: typeof LuciaError) => ({
		// adapter
	});
};

lucia({
	adapter: customAdapter(options)
});
```

## `Adapter`

```ts
type Adapter = {
	getSessionAndUser?: (
		sessionId: string
	) => Promise<[SessionSchema, UserSchema] | [null, null]>;
} & UserAdapter &
	SessionAdapter;
```

| type                                                                      |
| ------------------------------------------------------------------------- |
| [`UserAdapter`](/extending-lucia/database-adapters-api#useradapter)       |
| [`SessionAdapter`](/extending-lucia/database-adapters-api#sessionadapter) |

### `getSessionAndUser()`

- An _optional_ method of `Adapter`
- Must select `session` where `session(id)` equals parameter `sessionId`
- Must select `user` where `user(id)` equals `session(id)` of selected `session`
- Must return the session and user in a tuple if both exists, or `null, null` if not

```ts
const getSessionAndUser: (
	sessionId: string
) => Promise<
	[session: SessionSchema, user: UserSchema] | [session: null, user: null]
>;
```

##### Parameters

| name        | type     | description                 |
| ----------- | -------- | --------------------------- |
| `sessionId` | `string` | Unique target `session(id)` |

##### Returns

| name      | type                                                        | description            |
| --------- | ----------------------------------------------------------- | ---------------------- |
| `session` | [`SessionSchema`](/basics/database#session-table)` \| null` | Target session         |
| `user`    | [`UserSchema`](/basics/database#user-table)` \| null`       | User of target session |

## `UserAdapter`

```ts
type UserAdapter = Readonly<{
	getUser: (userId: string) => Promise<UserSchema | null>;
	setUser: (user: UserSchema, key: KeySchema | null) => Promise<void>;
	updateUser: (
		userId: string,
		partialUser: Partial<UserSchema>
	) => Promise<void>;
	deleteUser: (userId: string) => Promise<void>;

	getKey: (keyId: string) => Promise<KeySchema | null>;
	getKeysByUserId: (userId: string) => Promise<KeySchema[]>;
	setKey: (key: KeySchema) => Promise<void>;
	updateKey: (keyId: string, partialKey: Partial<KeySchema>) => Promise<void>;
	deleteKey: (keyId: string) => Promise<void>;
	deleteKeysByUserId: (userId: string) => Promise<void>;
}>;
```

### `deleteKey()`

- Must delete unique `key` where `key(id)` equals parameter `keyId`
- Must return `void`
- Parameter `keyId` may be invalid
- Invalid `keyId` must be ignored and no errors should be thrown

```ts
const deleteKey: (keyId: string) => Promise<void>;
```

##### Parameters

| name    | type     | description             |
| ------- | -------- | ----------------------- |
| `keyId` | `string` | Unique target `key(id)` |

### `deleteKeysByUserId()`

- Must delete multiple `key` where `key(user_id)` equals parameter `userId`
- Must return `void`
- Parameter `userId` may be invalid
- Invalid `userId` must be ignored and no errors should be thrown

```ts
const deleteKeysByUserId: (userId: string) => Promise<void>;
```

##### Parameters

| name     | type     | description           |
| -------- | -------- | --------------------- |
| `userId` | `string` | Target `key(user_id)` |

### `deleteUser()`

- Must delete unique `user` where `user(id)` equals parameter `userId`
- Must return `void`
- Parameter `userId` may be invalid
- Invalid `userId` must be ignored and no errors should be thrown

```ts
const deleteUser: (userId: string) => Promise<void>;
```

##### Parameters

| name     | type     | description              |
| -------- | -------- | ------------------------ |
| `userId` | `string` | Unique target `user(id)` |

### `getKey()`

- Must select unique `key` where `key(id)` equals parameter `keyId`
- Must return target `key` or `null` if there are no matches

```ts
const getKey: (keyId: string) => Promise<KeySchema | null>;
```

##### Parameters

| name    | type     | description            |
| ------- | -------- | ---------------------- |
| `keyId` | `string` | Unique arget `key(id)` |

##### Returns

| type                                      | description  |
| ----------------------------------------- | ------------ |
| [`KeySchema`](/basics/database#key-table) | Target `key` |

### `getKeysByUserId()`

- Must select multiple `key` where `key(user_id)` equals parameter `userId`
- Must return an array of `key` or an empty array if there are no matches

```ts
const getKeysByUserId: (userId: string) => Promise<KeySchema[]>;
```

##### Parameters

| name     | type     | description           |
| -------- | -------- | --------------------- |
| `userId` | `string` | Target `key(user_id)` |

##### Returns

| type                                          | description            |
| --------------------------------------------- | ---------------------- |
| [`KeySchema`](/basics/database#key-table)`[]` | Array of matched `key` |

### `getUser()`

- Must select unique `user` where `user(id)` equals parameter `userId`
- Must return target `user` or `null` if there are no matches

```ts
const getUser: (userId: string) => Promise<UserSchema | null>;
```

##### Parameters

| name     | type     | description              |
| -------- | -------- | ------------------------ |
| `userId` | `string` | Unique target `user(id)` |

##### Returns

| type                                        | description   |
| ------------------------------------------- | ------------- |
| [`UserSchema`](/basics/database#user-table) | Target `user` |

### `setKey()`

- Must create new `key`
- Must throw error `AUTH_DUPLICATE_KEY_ID` if `key(id)` violates unique constraint
- May throw `AUTH_INVALID_USER_ID` if `key(user_id)` violates foreign key constraint

```ts
const setKey: (key: KeySchema) => Promise<void>;
```

##### Parameters

| name  | type                                      | description     |
| ----- | ----------------------------------------- | --------------- |
| `key` | [`KeySchema`](/basics/database#key-table) | `key` to create |

### `setUser()`

- Must create new `user`
- Must create new `key` if parameter `key` is defined
- Must throw error `AUTH_DUPLICATE_KEY_ID` if `key(id)` violates unique constraint, if parameter `key` is defined
- `key` must not be created if `user` creation errors

```ts
const setUser: (user: UserSchema, key: KeySchema | null) => Promise<void>;
```

##### Parameters

| name   | type                                               | description                 |
| ------ | -------------------------------------------------- | --------------------------- |
| `user` | [`UserSchema`](/basics/database#user-table)        | `user` to create            |
| `key`  | [`KeySchema`](/basics/database#key-table)`\| null` | `key` to create, if defined |

### `updateKey()`

- Must update fields, defined in parameter `partialKey`, of unique `key` where `key(id)` equals parameter `keyId`
- Must return `void`
- May throw error `AUTH_INVALID_KEY_ID` if target `key` does not exist

```ts
const updateKey: (
	keyId: string,
	partialKey: Partial<KeySchema>
) => Promise<void>;
```

##### Parameters

| name         | type                                                   | description             |
| ------------ | ------------------------------------------------------ | ----------------------- |
| `keyId`      | `string`                                               | Unique target `key(id)` |
| `partialKey` | `Partial<`[`KeySchema`](/basics/database#key-table)`>` | `key` fields to update  |

### `updateUser()`

- Must update fields, defined in parameter `partialKey`, of unique `user` where `user(id)` equals parameter `userId`
- Must return `void`
- May throw error `AUTH_INVALID_USER_ID` if target `key` does not exist

```ts
const updateUser: (
	userId: string,
	partialUser: Partial<UserSchema>
) => Promise<void>;
```

##### Parameters

| name          | type                                                     | description              |
| ------------- | -------------------------------------------------------- | ------------------------ |
| `userId`      | `string`                                                 | Unique target `user(id)` |
| `partialUser` | `Partial<`[`UserSchema`](/basics/database#user-table)`>` | `user` fields to update  |

## `SessionAdapter`

```ts
type SessionAdapter = Readonly<{
	getSession: (sessionId: string) => Promise<SessionSchema | null>;
	getSessionsByUserId: (userId: string) => Promise<SessionSchema[]>;
	setSession: (session: SessionSchema) => Promise<void>;
	updateSession: (
		sessionId: string,
		partialSession: Partial<SessionSchema>
	) => Promise<void>;
	deleteSession: (sessionId: string) => Promise<void>;
	deleteSessionsByUserId: (userId: string) => Promise<void>;
}>;
```

### `deleteSession()`

- Must delete unique `session` where `session(id)` equals parameter `sessionId`
- Returns `void`
- Parameter `sessionId` may be invalid
- Invalid `sessionId` must be ignored and no errors should be thrown

```ts
const deleteSession: (sessionId: string) => Promise<void>;
```

##### Parameters

| name        | type     | description                 |
| ----------- | -------- | --------------------------- |
| `sessionId` | `string` | Unique target `session(id)` |

### `deleteSessionsByUserId()`

- Must delete multiple `session` where `session(user_id)` equals parameter `userId`
- Must return `void`
- Parameter `userId` may be invalid
- Invalid `userId` must be ignored and no errors should be thrown

```ts
const deleteSessionsByUserId: (userId: string) => Promise<void>;
```

##### Parameters

| name     | type     | description               |
| -------- | -------- | ------------------------- |
| `userId` | `string` | Target `session(user_id)` |

### `getSession()`

- Must select unique `session` where `session(id)` equals parameter `sessionId`
- Must return target `session` or `null` if there are no matches

```ts
const getSession: (sessionId: string) => Promise<SessionSchema | null>;
```

##### Parameters

| name        | type     | description                 |
| ----------- | -------- | --------------------------- |
| `sessionId` | `string` | Unique target `session(id)` |

##### Returns

| type                                              | description      |
| ------------------------------------------------- | ---------------- |
| [`SessionSchema`](/basics/database#session-table) | Target `session` |

### `getSessionsByUserId()`

- Must select multiple `session` where `session(user_id)` equals parameter `userId`
- Must return an array of `session` or an empty array if there are no matches

```ts
const getSessionsByUserId: (userId: string) => Promise<SessionSchema[]>;
```

##### Parameters

| name     | type     | description               |
| -------- | -------- | ------------------------- |
| `userId` | `string` | Target `session(user_id)` |

##### Returns

| type                                                  | description                |
| ----------------------------------------------------- | -------------------------- |
| [`SessionSchema`](/basics/database#session-table)`[]` | Array of matched `session` |

### `setSession()`

- Must create new `session`
- May throw `AUTH_INVALID_USER_ID` if `session(user_id)` violates foreign key constraint

```ts
const setSession: (session: SessionSchema) => Promise<void>;
```

##### Parameters

| name      | type                                              | description         |
| --------- | ------------------------------------------------- | ------------------- |
| `session` | [`SessionSchema`](/basics/database#session-table) | `session` to create |

### `updateSession()`

- Must update fields, defined in parameter `partialSession`, of unique `session` where `session(id)` equals parameter `keyId`
- Must return `void`
- May throw error `AUTH_INVALID_SESSION_ID` if target `session` does not exist

```ts
const updateSession: (
	keyId: string,
	partialKey: Partial<SessionSchema>
) => Promise<void>;
```

##### Parameters

| name             | type                                                           | description                 |
| ---------------- | -------------------------------------------------------------- | --------------------------- |
| `sessionId`      | `string`                                                       | Unique target `session(id)` |
| `partialSession` | `Partial<`[`SessionSchema`](/basics/database#session-table)`>` | `session` fields to update  |
