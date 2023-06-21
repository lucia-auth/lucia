---
order: 1
title: "Keys"
description: "Learn about keys in Lucia"
---

Keys represent the relationship between a user and a reference to that user. While the user id is the primary way of identifying a user, there are other ways your app may reference a user during the authentication step such as by their username, email, or Github user id. These identifiers, be it from a user input or an external source, are provided by a _provider_, identified by a _provider id_. The unique id for that user within the provider is the _provider user id_. The unique combination of the provider id and provider user id makes up a key.

A user can have any number of keys, allowing for multiple ways of referencing and authenticating users without cramming your user table. Key can also optionally hold a password, which is useful for implementing a password based authentication. If provided, passwords are automatically hashed by Lucia before storage.

```ts
const key: Key = {
	providerId: "email",
	providerUserId: "user@example.com",
	passwordDefined: true,
	userId: "laRZ8RgA34YYcgj"
};
```

### Examples

#### Email & password

Below, you're referencing a user where they're identified with "user@example.com" when using "email" provider, and validating their password if a user exist.

```ts
import { auth } from "./lucia.js";

const key = await auth.useKey("email", "user@example.com", "123456");
const user = await auth.getUser(key.userId);
```

#### OAuth

Below, you're referencing a user where they're identified with their Github user id when using "github" provider.

```ts
import { auth } from "./lucia.js";

const githubUser = await authenticateWithGithub(); // example - exact API not provided by Lucia
const key = await auth.useKey("github", githubUser.userId);
```

## Create keys

Keys can be created with [`Auth.createKey()`](/reference/lucia/interfaces/auth#createkey). This returns the newly created key, or throws `DUPLICATE_KEY_ID` if the key already exists.

```ts
import { auth } from "./lucia.js";
import { LuciaError } from "lucia";

try {
	const key = await auth.createKey(userId, {
		providerId: "email",
		providerUserId: "user@example.com",
		password: "123456"
	});
} catch (e) {
	if (e instanceof LuciaError && e.message === "DUPLICATE_KEY_ID") {
		// key already exists
	}
	// unexpected database errors
}
```

```ts
const key = await auth.createKey(userId, {
	providerId: "github",
	providerUserId: githubUserId,
	password: null // a value must be provided
});
```

### Create keys when creating users

In most cases, you want to create a key whenever you create (i.e. register) a new user. [`Auth.createKey()`](/reference/lucia/interfaces/auth#createkey) includes a parameter to define a key. `null` can be passed to `key` if you don't need to create a key. This preferable to using `Auth.createUser()` and `Auth.createKey()` consecutively as the user will not be created when the key already exists.

Similar to `Auth.createKey()`, it will throw `DUPLICATE_KEY_ID` if the key already exists.

```ts
import { auth } from "./lucia.js";
import { LuciaError } from "lucia";

try {
	const user await auth.createUser({
		key: {
			providerId,
			providerUserId,
			password
		} // same params as `Auth.createKey()`,
		// ...
	});
} catch (e) {
	if (e instanceof LuciaError && e.message === "DUPLICATE_KEY_ID") {
		// key already exists
	}
	// provided user attributes violates database rules (e.g. unique constraint)
	// or unexpected database errors
}
```

## Validate keys

[`Auth.useKey()`](/reference/lucia/interfaces/auth#usekey) can be used to validate a key password and get the key (which includes the user id). This method returns the validated key, or throws `AUTH_INVALID_KEY_ID` on invalid key and `AUTH_INVALID_PASSWORD` on invalid key password.

You must pass `null` if the key does not hold a password, or pass a valid password if it does. To skip the password check, [use `Auth.getKey()`](/basics/keys#get-keys) instead.

```ts
import { auth } from "./lucia.js";
import { LuciaError } from "lucia";

try {
	const key = await auth.useKey("email", "user@example.com", "123456"); // validate password too
	const user = await auth.getUser(key.userId);
} catch (e) {
	if (e instanceof LuciaError && e.message === "AUTH_INVALID_KEY_ID") {
		// invalid key
	}
	if (e instanceof LuciaError && e.message === "AUTH_INVALID_PASSWORD") {
		// incorrect password
	}
	// unexpected database error
}
```

```ts
const githubUser = await authenticateWithGithub(); // example - exact API not provided by Lucia
try {
	// must pass `null` as the password for it to be valid
	const key = await auth.useKey("github", githubUser.userId, null);
} catch (e) {
	if (e instanceof LuciaError && e.message === "AUTH_INVALID_KEY_ID") {
		// invalid key
	}
	// unexpected database error
}
```

## Get keys

You can get a key with [`Auth.getKey()`](/reference/lucia/interfaces/auth#getkey), which returns a key or throws `AUTH_INVALID_KEY_ID` if the key does not exist. Unlike `Auth.useKey()`, this does not validate the key password.

```ts
import { auth } from "./lucia.js";
import { LuciaError } from "lucia";

try {
	const key = await auth.getKey(providerId, providerUserId);
} catch (e) {
	if (e instanceof LuciaError && e.message === "AUTH_INVALID_KEY_ID") {
		// invalid key
	}
	// unexpected database error
}
```

## Get all keys of a user

[`Auth.getAllUserKeys()`](/reference/lucia/interfaces/auth#getalluserkeys) can be used to get all keys linked to a user. It returns an array of keys or throw `AUTH_INVALID_USER_ID` if the user id is invalid.

```ts
import { auth } from "./lucia.js";
import { LuciaError } from "lucia";

try {
	const keys = await auth.getAllUserKeys(userId);
} catch (e) {
	if (e instanceof LuciaError && e.message === "AUTH_INVALID_USER_ID") {
		// invalid user id
	}
	// unexpected database error
}
```

## Update key password

You can update a key's password with [`Auth.updateKeyPassword()`](/reference/lucia/interfaces/auth#updatekeypassword). This returns the updated key or throw `AUTH_INVALID_KEY_ID` if the key doesn't exist. You can pass `null` to `newPassword` to remove the password.

```ts
import { auth } from "./lucia.js";

try {
	const key = await auth.updateKeyPassword(
		providerId,
		providerUserId,
		newPassword
	);
} catch (e) {
	if (e instanceof LuciaError && e.message === "AUTH_INVALID_KEY_ID") {
		// invalid key
	}
	// unexpected database error
}
```

```ts
await auth.updateKeyPassword("email", "user@example.com", "654321");
```

## Delete keys

You can delete a key using [`Auth.deleteKey()`](/reference/lucia/interfaces/auth#deletekey). This will succeed regardless of the existence of the key.

```ts
await auth.deleteKey("username", username);
```
