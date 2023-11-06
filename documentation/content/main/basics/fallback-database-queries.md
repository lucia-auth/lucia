---
title: "Falling back to database queries"
description: "Learn how to use database queries when Lucia's API isn't enough"
---

Sometimes, Lucia's API isn't enough. For example, you might want to create a user within a database transaction. The great thing about Lucia is that you can always fallback to raw database queries when you need to. And since a lot of Lucia's API is really just a light wrapper around database queries, it's often easy to implement.

That said, we discourage replacing any APIs related to session management, especially since at that point you might be better off replacing Lucia entirely.

## Create users and keys

[`Auth.createUser()`](/reference/lucia/interfaces/auth#createuser) creates both a key and user in a database transaction. Creating a user is pretty straightforward. The user id is 15 characters long when using the default configuration.

```ts
import { generateRandomString } from "lucia/utils";

// implement `Auth.createUser()`
// execute all in a single transaction
await db.transaction((trx) => {
	const userId = generateRandomString(15);
	await trx.user.insert({
		id: userId,
		// any additional column for user attributes
		username
	});

	// TODO: create key
});
```

Keys are bit more complicated. The key id is a combination of the provider id and provider user id. You can create it using [`createKeyId()`](/reference/lucia/modules/main#createkeyid). For `hashed_password`, you can use [`generateLuciaPasswordHash()`](/reference/lucia/modules/utils#generateluciapasswordhash) to hash passwords using Lucia's default hashing function or set it to `null`.

This part is exactly the same for [`Auth.createKey()`](/reference/lucia/interfaces/auth#createkey).

```ts
import { generateRandomString, generateLuciaPasswordHash } from "lucia/utils";
import { createKeyId } from "lucia";

// execute all in a single transaction
await db.transaction((trx) => {
	const userId = generateRandomString(15); //
	await trx.user.insert({
		id: userId,
		username
	});

	await trx.key.insert({
		id: createKeyId("username", username),
		user_id: userId,
		hashed_password: await generateLuciaPasswordHash(password)
	});
});
```

## Transform database objects

Lucia's `Auth` instance includes methods to transform database query results:

- [`Auth.transformDatabaseUser()`](/reference/lucia/interfaces/auth#transformdatabaseuser): [`UserSchema`](/reference/lucia/interfaces#userschema) to `User`
- [`Auth.transformDatabaseKey()`](/reference/lucia/interfaces/auth#transformdatabasekey): [`KeySchema`](/reference/lucia/interfaces#keyschema) to `Key`
- [`Auth.transformDatabaseSession()`](/reference/lucia/interfaces/auth#transformdatabasesession): [`SessionSchema`](/reference/lucia/interfaces#sessionschema) to `Session`

```ts
import { auth } from "./lucia.js";

const databaseUser = await db.user.get(userId);
const user = auth.transformDatabaseUser(databaseUser);
```
