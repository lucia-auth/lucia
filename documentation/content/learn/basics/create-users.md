---
order: 0
title: "Create users"
---

The [`createUser()`](/reference/api/server-api#createuser) method can be used to create users, which requires a provider name and identifier. Lucia (or the database) will automatically generate a user id for your users on creation. However, you can generate your own user id using [`configurations.generateCustomUserId()`](/reference/configure/lucia-configurations#generatecustomuserid).

This method will not create a new session. To create a new session after creating a user, refer to [Create sessions](/learn/basics/create-sessions).

```ts
import { auth } from "./lucia.js";

await auth.createUser(providerName, identifier, options);
```

## Create a user

### Without a password

This is useful when you can trust the input for the provider name and identifier. When implementing OAuth for example, you can trust that the provider has validated the user and has given you the correct identifier (you will never get the information about of B when user A signs in with the OAuth provider).

```ts
import { auth } from "./lucia.js";

try {
	await auth.createUser("github", "user@example.com");
} catch {
	// invalid input
}
```

### With a password

This is useful for the simple email/username and password approach. The password will be automatically hashed when storing the user's data.

```ts
import { auth } from "./lucia.js";

try {
	await auth.createUser("email", "user@example.com", {
		password: "123456"
	});
} catch {
	// invalid input
}
```

## Store user attributes

By default, Lucia will store the user id, provider id, and the hashed password (if a password is provided). The components of the provider id - the provider name and identifier - are not stored inside its own column, but is combined so as to be stored in a single column. Lucia allows you to add additional columns to the `user` table to store user attributes. Refer to [Store user attributes](/learn/basics/store-user-attributes) for implementations.

```ts
import { auth } from "./lucia.js";

try {
	await auth.createUser("github", "user@example.com", {
		attributes: {
			username: "user"
		}
	});
} catch {
	// invalid input
}
```

## Example

The following example uses `email` as the provider name and the provided email as the identifier.

```ts
import { auth } from "./lucia.js";

const createUser = async (email: string, password: string) => {
	try {
		const user = await auth.createUser("email", email, {
			password
		});
	} catch {
		// error (user already exists, etc)
	}
};
```
