---
order: 1
title: "Keys"
description: "Learn about keys in Lucia"
---

Keys represent the relationship between a user and a reference to that user. While the user id is the primary way of identifying a user, there are other ways your app may reference a user during the authentication step such as by their username, email, or Github user id. These identifiers, be it from a user input or an external source, are provided by a _provider_, identified by a _provider id_. The unique id for that user within the provider is the _provider user id_. The unique combination of the provider id and provider user id makes up a key.

A user can have any number of keys, allowing for multiple ways of referencing and authenticating users without cramming your user table. Key can also optionally hold a password, which is useful for implementing a password based authentication. If provided, passwords are automatically hashed by Lucia before storage.

### Examples

#### Email & password

Below, you're referencing a user where they're identified with "user@example.com" when using "email" provider, and validating their password if a user exist.

```ts
import { auth } from "./lucia.js";

try {
	const key = await auth.useKey("email", "user@example.com", "123456");
	const user = await auth.getUser(key.userId);
} catch {
	// key does not exist
	// or incorrect password
}
```

#### OAuth

Below, you're referencing a user where they're identified with their Github user id when using "github" provider.

```ts
import { auth } from "./lucia.js";

const githubUser = await authenticateWithGithub(); // example - exact API not provided by Lucia
try {
	const key = await auth.useKey("github", githubUser.userId);
} catch {
	// key does not exist
}
```

## Create keys

Keys can be created with [`Auth.createKey()`]().

```ts
import { auth } from "./lucia.js";

try {
	await auth.createKey(userId, {
		providerId: "email",
		providerUserId: "user@example.com",
		password: "123456"
	});
} catch {
	// key already exists
}
```

```ts
import { auth } from "./lucia.js";

try {
	await auth.createKey(userId, {
		providerId: "github",
		providerUserId: githubUserId,
		password: null // a value must be provided
	});
} catch {
	// key already exists
}
```

### Create keys when creating users

In most cases, you want to create a key whenever you create (i.e. register) a new user. [`Auth.createKey()`]() includes a parameter to define a key. This preferable to using `Auth.createUser()` and `Auth.createKey()` consecutively as the user will not be created when the key already exists.

```ts
import { auth } from "./lucia.js";

try {
	await auth.createUser({
		key: {
			providerId,
			providerUserId,
			password
		} // same params as `Auth.createKey()`,
		// ...
	});
} catch {
	// key already exists
	// or unique constraint failed for user attributes
}
```

`null` can be passed to `key` if you don't need to create a key.

## Validate keys

[`Auth.useKey()`]() can be used to validate a key password and get the key (which includes the user id). You must pass `null` if the key does not hold a password, and pass a valid password if it does. To skip the password check, use `Auth.getKey()` instead (next section).

```ts
import { auth } from "./lucia.js";

try {
	const key = await auth.useKey("email", "user@example.com", "123456"); // validate password too
	const user = await auth.getUser(key.userId);
} catch {
	// key does not exist
	// or incorrect password
}
```

```ts
const githubUser = await authenticateWithGithub(); // example - exact API not provided by Lucia
try {
	const key = await auth.useKey("github", githubUser.userId);
} catch {
	// key does not exist
}
```

## Get keys

You can get a key with [`Auth.getKey()`](). Unlike `Auth.useKey()`, this does not validate the key password.

```ts
import { auth } from "./lucia.js";

try {
	const key = await auth.getKey(providerId, providerUserId);
} catch {
	// key does not exist
}
```

## Get all keys of a user

[`Auth.getAllUserKeys()`]() can be used to get all keys linked to a user.

```ts
import { auth } from "./lucia.js";

try {
	const keys = await auth.getAllUserKeys(userId);
} catch {
	// invalid user id
}
```

## Update key password

You can update a key's password with [`Auth.updateKeyPassword()`](). You can pass `null` to `newPassword` to remove the password.

```ts
import { auth } from "./lucia.js";

try {
	const key = await auth.updateKeyPassword(providerId, providerUserId, newPassword);
} catch {
	// key does not exist
}
```
```ts
await auth.updateKeyPassword("email", "user@example.com", "654321");
```

## Delete keys

You can delete a key using [`Auth.deleteKey()`](). This will succeed regardless of the existence of the key.

```ts
await auth.deleteKey("username", username);
```