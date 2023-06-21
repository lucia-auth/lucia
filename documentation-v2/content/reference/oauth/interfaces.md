---
order: 3
title: "Interfaces"
---

## `OAuthProvider`

See each provider's page.

```ts
type OAuthProvider = {
	getAuthorizationUrl: () => Promise<[URL, ...any[]]>;
	validateCallback: (
		code: string,
		...optionalArgs: any[]
	) => Promise<ProviderUserAuth>;
};
```

## `OAuthRequestError`

Extends standard `Error`.

```ts
type OAuthRequestError = Error & {
	request: Request;
	response: Response;
};
```

## `ProviderUserAuth`

```ts
type ProviderUserAuth = {
	existingUser: User | null;
	createKey: (userId: string) => Promise<Key>;
	createUser: (attributes: Lucia.DatabaseUserAttributes) => Promise<User>;
};
```

### Properties

| name           | type                                                 | description                                       |
| -------------- | ---------------------------------------------------- | ------------------------------------------------- |
| `existingUser` | [`User`](/reference/lucia/interfaces#user)` \| null` | User linked to the provider account, if it exists |

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
const createUser: (attributes: Lucia.DatabaseUserAttributes) => Promise<User>;
```

##### Parameters

| name         | type                           | description                     |
| ------------ | ------------------------------ | ------------------------------- |
| `attributes` | `Lucia.DatabaseUserAttributes` | User attributes of the new user |

##### Returns

| type                                       | description |
| ------------------------------------------ | ----------- |
| [`User`](/reference/lucia/interfaces#user) | A new user  |

#### Example

```ts
createUser({
	username: githubUsername
});
```
