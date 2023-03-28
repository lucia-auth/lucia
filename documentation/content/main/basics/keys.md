---
_order: 1
title: "Keys"
description: "Learn about keys in Lucia"
---

Keys allow you to reference users using external data from a _provider_. Keys are defined with a _provider id_, which is just a unique id for the provider, and a _provider user id_, which is the unique identifier of the user within the provided data.

While you can (and should) have multiple keys with the same provider id, the combination of the provider id and provider user id should be unique.

> The easiest way to think about keys is that the provider id is the authentication method, and the provider user id is something unique to the user within the method used.

### Persistent keys

The first type of keys are persistent keys. These persist across multiple usages in contrast to single use keys (defined below) which are consumed after a single use. These are useful for traditional email/password sign ins and OAuth sign ins.

When authenticating users (log in), you get the user data from an external provider, such as the email from the user's input or the Github user id for social login. Persistent keys allow you to link such external data from a _provider_ with Lucia users stored in your database. This type of key can hold a password, which will be hashed and can be validated with Lucia's API. This is mainly for implementing password logins.

For example, for email/password, "email" can be the provider id, the user’s email can be the provider user id, and the user's password can be stored as the key's password. For Github OAuth, "github" can be the provider id and the user’s GitHub user id can be the provider user id.

#### Primary keys

Primary keys are a special type of persistent key. They are created when the user is created and can only be deleted when the user is deleted. This ensures the authentication method the user used for creating the account cannot be deleted (leading to a lockout) if someone else gains access to it.

### Single use keys

Single use keys are single use only and are deleted on read. Single use keys must have an expiration. This is useful for implementing single use verification tokens for one-time passwords and magic links. This type of key can also hold passwords.

## Use keys

You can validate both persistent and single-use keys with [`useKey()`](/reference/lucia-auth/auth#usekey) using the provided password (can be `null`) and current time.

```ts
import { auth } from "./lucia.js";

try {
	const key = await auth.useKey("email", email, password);
} catch {
	// invalid key
}
```

> (warn) While the error will indicate it if the key or password was invalid, **be ambiguous with the error message** (eg. "Incorrect username or password").

```ts
import { auth } from "./lucia.js";

try {
	const key = await auth.useKey("github", githubUserId, null);
} catch {
	// invalid key
}
```

## Get key

There's also [`getKey()`](/reference/lucia-auth/auth#getkey) to retrieve keys. However, you cannot validate passwords, and more importantly, this will **NOT** check the key's expiration for single use keys.

```ts
import { auth } from "./lucia.js";

try {
	const key = await auth.getKey("email", email);
} catch {
	// invalid key
}
```

### Get all keys of a user

You can get all keys belonging to a user using [`getAllUserKeys()`](/reference/lucia-auth/auth#getalluserkeys). As with `getKey()` above, this will not check for the key's expiration.

```ts
try {
	const keys = await auth.getAllUserKeys(userId);
	const primaryKey = keys.find((key) => key.isPrimary);
} catch {
	// invalid user id
}
```

## Create new keys

You can create a new key for a user using [`createKey()`](/reference/lucia-auth/auth#createkey).

### Persistent keys

Primary keys **CANNOT** be created with this method. You can provide a `password` to add a password to the key. Lucia will handle the hashing.

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

### Single use keys

You can provide a `password` to set a password. Define the duration (in seconds) of a single use key by providing a `expiresIn`.

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

You can delete a non-primary key with [`deleteKey()`](/reference/lucia-auth/auth#deletekey). You cannot delete primary keys with this method. This will succeed regardless of the validity of key.

```ts
try {
	const key = await auth.updateKeyPassword("username", username, newPassword);
} catch {
	// invalid key
}
```
