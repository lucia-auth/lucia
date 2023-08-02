---
title: "Account linking"
description: "Learn how to link multiple authentication methods to a single user"
---

When providing more than one sign in options, you may want to link multiple methods to a single user. This allows the user to sign in with any of the provided options and be logged in as the same application user. One way of achieving this is to automatically link social accounts with the same email.

> (red) **Make sure your OAuth provider has verified the user's email.**

Here's a basic OAuth implementation using the official integration.

```ts
const { existingUser, createUser, providerUser } = validateCallback(code);

const getUser = async () => {
	if (existingUser) return existingUser;
	return await createUser({
		attributes: {
			email: providerUser.email
		}
	});
};

const user = await getUser();

// create session and sign in
```

Instead of creating a new user, we can check if a user with the email already exists, and if so, link the authentication method to that user by creating a new key.

It's important to note `existingUser` is defined if a user linked to the provider's user id (e.g. Github user id) exists. It is _not_ based on the email. As such, you will have to query the user table to find if a user with the email already exists. If it does, use [`ProviderUserAuth.createKey()`]() to link the method to the user. You can use [`transformDatabaseUser()`]() to get Lucia's `User` object from the database result.

**It's crucial to ensure that the email has been verified.**

```ts
import { auth } from "./lucia.js";

const { existingUser, createUser, providerUser, createKey } =
	validateCallback(code);

const getUser = async () => {
	if (existingUser) return existingUser;
	if (!providerUser.email_verified) {
		throw new Error("Email not verified");
	}
	const existingDatabaseUserWithEmail = await db.getUserByEmail(
		providerUser.email
	);
	if (existingUserWithEmail) {
		// transform `UserSchema` to `User`
		const user = auth.transformDatabaseUser(existingDatabaseUserWithEmail);
		await createKey(user.userId);
		return auth.transformDatabaseUser(existingUserWithEmail);
	}
	return await createUser({
		attributes: {
			email: providerUser.email
		}
	});
};
```