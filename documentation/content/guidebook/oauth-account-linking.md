---
title: "OAuth account linking"
description: "Learn how to link multiple providers to a single user"
---

When providing more than one ways to sign in, you may want to link multiple providers to a single user. This allows the user to sign in with any of the provided options and be logged in as the same application user. One way of achieving this is to automatically link accounts with the same email.

> (red) **Make sure your OAuth provider has verified the user's email.**

Here's a basic OAuth implementation using the official integration.

```ts
const { getExistingUser, createUser, providerUser } = providerAuth.validateCallback(code);

const getUser = async () => {
	const existingUser = await getExistingUser();
	if (existingUser) return existingUser;
	if (!providerUser.email_verified) {
		throw new Error("Email not verified");
	}
	return await createUser({
		attributes: {
			email: await getGithubUserEmail(githubUser)
		}
	});
};

const user = await getUser();

// create session and sign in
```

Instead of creating a new user, we can check if a user with the email already exists, and if so, link the authentication method to that user by creating a new key.

It's important to note `existingUser` is defined if a user linked to the provider's user id (e.g. GitHub user id) exists. It is _not_ based on the email. As such, you will have to query the user table to find if a user with the email already exists. If it does, use [`ProviderUserAuth.createKey()`](/reference/oauth/interfaces/provideruserauth#createkey) to link the method to the user. You can use [`transformDatabaseUser()`](/reference/lucia/interfaces/auth#transformdatabaseuser) to get Lucia's `User` object from the database result.

**It's crucial to ensure that the email has been verified.**

```ts
import { auth } from "./lucia.js";

const { getExistingUser, createUser, providerUser, createKey } =
	providerAuth.validateCallback(code);

const getUser = async () => {
	const existingUser = await getExistingUser();
	if (existingUser) return existingUser;
	if (!providerUser.email_verified) {
		throw new Error("Email not verified");
	}
	const existingDatabaseUserWithEmail = await db.getUserByEmail(providerUser.email);
	if (existingDatabaseUserWithEmail) {
		// transform `UserSchema` to `User`
		const user = auth.transformDatabaseUser(existingDatabaseUserWithEmail);
		await createKey(user.userId);
		return user;
	}
	return await createUser({
		attributes: {
			email: providerUser.email
		}
	});
};

const user = await getUser();

// create session and sign in
```
