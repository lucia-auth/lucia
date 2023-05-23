---
_order: 1
title: "`ProviderSession`"
---

```ts
type ProviderSession = {
	existingUser: User | null;
	createUser: (userAttributes: Lucia.UserAttributes) => Promise<User>;
	createPersistentKey: (userId: string) => Promise<Key>;
	providerUser: Record<string, any>;
	tokens: {
		accessToken: string;
		[data: string]: string;
	};
};
```

## Properties

Refer to each provider's page for specific type of `providerUser` and `tokens`.

| name                                                                        | type                                                 | description                                       |
| --------------------------------------------------------------------------- | ---------------------------------------------------- | ------------------------------------------------- |
| existingUser                                                                | [`User`](/reference/lucia-auth/types#user)` \| null` | existing user - null if non-existent (= new user) |
| [createUser](/reference/oauth/providersession#createuser)                   | `Function`                                           |                                                   |
| [createPersistentKey](/reference/oauth/providersession#createpersistentkey) | `Function`                                           |                                                   |
| providerUser                                                                | `Record<string, any>`                                | user info from the used provider                  |
| tokens                                                                      | `Record<string, any>`                                | access tokens (`accessToken`) among other tokens  |

## `createPersistentKey()`

Creates a new persistent key using the authorized session by calling [`Lucia.createKey()`](/reference/lucia-auth/auth#createkey) for the target user.

```ts
const createPersistentKey: (userId: string) => Promise<Key>;
```

#### Parameter

| name   | type     | description    |
| ------ | -------- | -------------- |
| userId | `string` | target user id |

#### Returns

| type                                     | description           |
| ---------------------------------------- | --------------------- |
| [`Key`](/reference/lucia-auth/types#key) | the newly created key |

#### Errors

Refer to [Lucia.createUser()](/reference/lucia-auth/auth#createkey)

## `createUser()`

Creates a new user for the authorized session by calling [`Lucia.createUser()`](/reference/lucia-auth/auth#createuser) using the provided user attributes. Refer to the provider's doc for the provider and identifier used.

```ts
const createUser: (userAttributes: Lucia.UserAttribute) => Promise<User>;
```

#### Parameter

| name           | type                                                                 | description                                 |
| -------------- | -------------------------------------------------------------------- | ------------------------------------------- |
| userAttributes | [`Lucia.UserAttributes`](/reference/lucia-auth/types#userattributes) | additional user data to store in user table |

#### Returns

| type                                       | description            |
| ------------------------------------------ | ---------------------- |
| [`User`](/reference/lucia-auth/types#user) | the newly created user |

#### Errors

Refer to [Lucia.createUser()](/reference/lucia-auth/auth#createuser)
