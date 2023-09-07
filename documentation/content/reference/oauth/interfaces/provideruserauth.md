---
title: "`ProviderUserAuth`"
---

```ts
interface ProviderUserAuth {
	createKey: (userId: string) => Promise<Key>;
	createUser: (options: {
		userId?: string;
		attributes: Lucia.DatabaseUserAttributes;
	}) => Promise<User>;
	getExistingUser: () => Promise<User | null>;
}
```

### `createKey()`

Creates a new key using the OAuth provider.

```ts
const createKey: (userId: string) => Promise<Key>;
```

##### Parameters

| name     | type     | description             |
| -------- | -------- | ----------------------- |
| `userId` | `string` | User to link the key to |

##### Returns

| type                                     | description |
| ---------------------------------------- | ----------- |
| [`Key`](/reference/lucia/interfaces#key) | A new key   |

### `createUser()`

Creates a new user and a key using the OAuth provider.

```ts
const createUser: (options: {
	userId?: string;
	attributes: Lucia.DatabaseUserAttributes;
}) => Promise<User>;
```

##### Parameters

| name                 | type                           | optional | description                     |
| -------------------- | ------------------------------ | :------: | ------------------------------- |
| `options.userId`     | `string`                       |    ✓     | User id of new user             |
| `options.attributes` | `Lucia.DatabaseUserAttributes` |          | User attributes of the new user |

##### Returns

| type                                       | description |
| ------------------------------------------ | ----------- |
| [`User`](/reference/lucia/interfaces#user) | A new user  |

## `getExistingUser()`

Returns a user linked to the provider account, if it exists.

##### Returns

| type                                                |
| --------------------------------------------------- |
| [`User`](/reference/lucia/interfaces#user)`\| null` |
