---
_order: 1
title: "Keys"
---

Keys allow you to reference users using external data from a provider. They're defined using a provider id and a provider user id. They can be persistent or single use, which is useful when implementing tokens for verification.

## Get key

You can get the key data using [`getKey()`](/reference/api/auth#getkey).

```ts
import { auth } from "./lucia.js";

try {
	const key = await auth.getKey("github", githubUserId);
} catch {
	// invalid key
}
```

### Get all keys of a user

You can get all keys belonging to a user using [`getAllUserKeys()`](/reference/api/auth#getalluserkeys).

```ts
try {
	const keys = await auth.getAllUserKeys(userId);
	const primaryKey = keys.find((key) => key.isPrimary);
} catch {
	// invalid user id
}
```

## Get user from keys

[`getKeyUser()`](/reference/api/auth#getkeyuser) can be used to get the user of the key based on the provider id and provider user id. This will throw an error if the key doesn't exist.

```ts
import { auth } from "./lucia.js";

try {
	const { key, user } = await auth.getKeyUser("github", githubUserId);
} catch {
	// invalid key
}
```

If the key was single use, this method will delete the key from the database.

## Validate key password

You can validate a key password and get the user with [`validateKeyPassword()`](/reference/api/auth#validatekeypassword). This method will only work with keys with a password.

```ts
import { auth } from "./lucia.js";

try {
	const key = await auth.validateKeyPassword("username", username, password);
} catch {
	// invalid key or password
}
```

> (warn) While the error will indicate it if the key or password was invalid, **be ambiguous with the error message** (eg. "Incorrect username or password").

If the key was single use, this method will delete the key from the database.

## Create new key

You can create a new key for a user using [`createKey()`](/reference/api/auth#createkey). You can only create non-primary keys with this method.

```ts
try {
	const key = await auth.createKey(userId, {
		providerId: "github",
		providerUserId: githubUsername,
		password: null
	});
} catch {
	// invalid input
}
```

### Single use keys

You can create single use keys by providing `timeout` property, which is the number of seconds the key is valid for.

```ts
try {
	const key = await auth.createKey(userId, {
		providerId: "email-verification",
		providerUserId: "user@example.com",
		password: "123456",
		timeout: 60 * 60 // 1 hour
	});
} catch {
	// invalid input
}
```

## Update key password

You can update the password of a key with [`updateKeyPassword()`](/reference/api/auth#createkey). You can pass in `null` to remove the password.

```ts
try {
	const key = await auth.updateKeyPassword("username", username, newPassword);
} catch {
	// invalid key
}
```

## Delete key

You can delete a non-primary key with [`deleteKey()`](/reference/api/auth#deletekey). You cannot delete primary keys. This method will succeed regardless of the validity of key.

```ts
try {
	const key = await auth.updateKeyPassword("username", username, newPassword);
} catch {
	// invalid key
}
```

## Using single use keys

Single use keys allow you to implement tokens for email verification and password resets. For example, to implement a password reset mechanism,

1. Find the user with the target email
2. Generate a long, random string if it exists
3. Create a new single use key with `"password-reset"` as the provider id and the random string as the provider user id
4. Send a link with the token inside search query params

To implement one-time passwords for email verification,

1. Generate a random string (8 chars)
2. Create a new single use key with `"email-verification"` as the provider id, the user id as as the provider user id, and the random string as the password
