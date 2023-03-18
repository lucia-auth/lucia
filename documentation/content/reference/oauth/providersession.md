---
_order: 1
title: "ProviderSession"
---

```ts
type ProviderSession<ProviderUser, ProviderTokens> = {
	existingUser: User | null;
	createUser: (userAttributes: Lucia.UserAttributes) => Promise<User>;
	createPersistentKey: (userId: string) => Promise<Key>;
	providerUser: ProviderUser;
	tokens: {
		accessToken: string;
		[data: string]: string;
	};
};
```

## Properties

| name                                                                      | type                                          | description                                       |
| ------------------------------------------------------------------------- | --------------------------------------------- | ------------------------------------------------- |
| existingUser                                                              | [`User`](/reference/api/types#user)` \| null` | existing user - null if non-existent (= new user) |
| [createUser](/oauth/reference/api-reference#createuser)                   | `Function`                                    |                                                   |
| [createPersistentKey](/oauth/reference/api-reference#createpersistentkey) | `Function`                                    |                                                   |
| providerUser                                                              | `ProviderUser`                                | user info from the used provider                  |
| tokens                                                                    | `ProviderTokens`                              | access tokens (`accessToken`) among other tokens  |

## `createPersistentKey()`

Creates a new persistent key using the authorized session by calling [`Lucia.createKey()`](/reference/api/auth#createkey) for the target user.

```ts
const createPersistentKey: (userId: string) => Promise<Key>;
```

#### Parameter

| name   | type     | description    |
| ------ | -------- | -------------- |
| userId | `string` | target user id |

#### Returns

| type                              | description           |
| --------------------------------- | --------------------- |
| [`Key`](/reference/api/types#key) | the newly created key |

#### Errors

Refer to [Lucia.createUser()](/reference/api/auth#createkey)

## `createUser()`

Creates a new user for the authorized session by calling [`Lucia.createUser()`](/reference/api/auth#createuser) using the provided user attributes. Refer to the provider's doc for the provider and identifier used.

```ts
const createUser: (userAttributes: Lucia.UserAttribute) => Promise<User>;
```

#### Parameter

| name           | type                                                                | description                                 |
| -------------- | ------------------------------------------------------------------- | ------------------------------------------- |
| userAttributes | [`Lucia.UserAttributes`](/reference/api/lucia-types#userattributes) | additional user data to store in user table |

#### Returns

| type                                | description            |
| ----------------------------------- | ---------------------- |
| [`User`](/reference/api/types#user) | the newly created user |

#### Errors

Refer to [Lucia.createUser()](/reference/api/auth#createuser)
