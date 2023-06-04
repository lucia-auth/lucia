---
_order: 1
title: "Keys"
description: "Learn about keys in Lucia"
---

Keys represent the relationship between a user and an auth method/strategy. It allows you to have multiple ways to reference users using external data (such as email in email/password auth) without needing to cram all that data into your user database instance. Such external data are provided by _providers_.

Keys are defined with a _provider id_, which is just a unique id for the provider, and a _provider user id_, which is the unique identifier of the user within the method used (defined using provider id). Keys can also hold passwords, allowing to reference users and validate them using the provided password.

```ts
// email/password auth
try {
	// reference the user where
	// their id is "user@example.com"
	// when using "email" auth method
	// and check their password
	const key = await auth.useKey("email", "user@example.com", "123456");
} catch {
	// such user does not exist
	// or incorrect password
}
```

```ts
// github OAuth
const githubUser = await authenticateWithGithub();
// reference the user where
// their identifier is their Github user id
// when using "github" auth method
const key = await auth.useKey("github", githubUser.userId);
```

### Persistent keys

The first type of keys are persistent keys. These persist across multiple usages in contrast to single use keys (defined below) which are consumed after a single use.

#### Primary keys

Primary keys are a special type of persistent keys. They are created when the user is created and can only be deleted when the user is deleted. This ensures the authentication method the user used for creating the account cannot be deleted (leading to a lockout) if someone else gains access to it.

### Single use keys

Single use keys are single use only and are deleted on read. Single use keys must have an expiration. This is useful for implementing single use verification tokens for one-time passwords and magic links.

## Create new keys

You can create a new key for a user using [`createKey()`](/reference/lucia-auth/auth#createkey). If you're creating a key for newly created user, we recommend using [`createUser()`](/reference/lucia-auth/auth?sveltekit#createuser) to make key a primary key. Primary keys cannot be created using `createKey()`.

### Persistent keys

You can provide a `password` to add a password to the key. This will be hashed before being stored in the database.

```ts
try {
	const key = await auth.createKey(userId, {
		type: "persistent",
		providerId: "github",
		providerUserId: githubUsername,
		password: null
	});
} catch {
	// invalid input
}
```

```ts
try {
	const key = await auth.createKey(userId, {
		type: "persistent",
		providerId: "email",
		providerUserId: "user@example.com",
		password: "123456"
	});
} catch {
	// invalid input
}
```

### Single use keys

You can provide a `password` to set a password, and define the duration (in seconds) before the key expires by providing `expiresIn`.

```ts
try {
	const key = await auth.createKey(userId, {
		type: "single_use",
		providerId: "email-verification",
		providerUserId: "user@example.com:12345678",
		password: null,
		expiresIn: 60 * 60 // 1 hour
	});
} catch {
	// invalid input
}
```

## Use keys

You can validate both persistent and single-use keys with [`useKey()`](/reference/lucia-auth/auth#usekey) using the provided password (can be `null`) and current time.

```ts
import { auth } from "./lucia.js";

try {
	const key = await auth.useKey("github", githubUserId, null);
} catch {
	// invalid key
}
```

### Validate password

For single use keys, it will only be consumed (deleted) if the password is correct.

```ts
import { auth } from "./lucia.js";

try {
	const key = await auth.useKey("email", email, password);
} catch {
	// invalid key
}
```

> (warn) While the error will indicate it if the key or password was invalid, **be ambiguous with the error message** (eg. "Incorrect username or password").

## Get key

There's also [`getKey()`](/reference/lucia-auth/auth#getkey) to retrieve keys. **This method will not validate the key password nor will it check the key's expiration (for single use keys).**

```ts
import { auth } from "./lucia.js";

try {
	const key = await auth.getKey("email", email);
} catch {
	// invalid key
}
```

### Get all keys of a user

You can get all keys belonging to a user using [`getAllUserKeys()`](/reference/lucia-auth/auth#getalluserkeys). As with `getKey()` above, **this will not check for the key's expiration.**

```ts
try {
	const keys = await auth.getAllUserKeys(userId);
	const primaryKey = keys.find((key) => key.isPrimary);
} catch {
	// invalid user id
}
```

## Update key passwords

You can update the password of a key with [`updateKeyPassword()`](/reference/lucia-auth/auth#updatekeypassword). You can pass in `null` to remove the password.

```ts
try {
	const key = await auth.updateKeyPassword("username", username, newPassword);
} catch {
	// invalid key
}
```

## Delete key

You can delete a non-primary key with [`deleteKey()`](/reference/lucia-auth/auth#deletekey). Primary keys cannot be deleted with this method and must deleted with the user using [`deleteUser()`](/reference/lucia-auth/auth?none#deleteuser). This will succeed regardless of the validity of key.

```ts
try {
	await auth.deleteKey("username", username);
} catch {
	// invalid key
}
```
