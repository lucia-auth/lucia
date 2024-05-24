---
title: "Users"
---

# Users

While Lucia does not provide APIs for creating and managing users, it still interacts with the user table.

```ts
interface Session extends UserAttributes {
	id: string;
}
```

## Create users

When creating users, you can use [`generateIdFromEntropySize()`](/reference/main/generateIdFromEntropySize) to generate user IDs, which takes the entropy size in bytes. This will generate a cryptographically secure random string consisting of lowercase letters and numbers.

```ts
import { generateIdFromEntropySize } from "lucia";

await db.createUser({
	// 16 characters long
	id: generateIdFromEntropySize(10)
});
```

Use Lucia's [`generateId()`](/reference/main/generateIdFromEntropySize) or Oslo's [`generateRandomString()`](https://oslo.js.org/reference/crypto/generateRandomString) if you're looking for a more customizable option.

```ts
import { generateId } from "lucia";

const id = generateId(15);

import { generateRandomString, alphabet } from "oslo/crypto";

const id = generateRandomString(15, alphabet("a-z", "A-Z", "0-9"));
```

## Define user attributes

Defining custom user attributes requires 2 steps. First, add the required columns to the user table. You can type it by declaring the `Register.DatabaseUserAttributes` type (must be an interface).

```ts
declare module "lucia" {
	interface Register {
		Lucia: typeof lucia;
		DatabaseUserAttributes: DatabaseUserAttributes;
	}
}

interface DatabaseUserAttributes {
	username: string;
}
```

You can then include them in the user object with the `getUserAttributes()` configuration.

```ts
const lucia = new Lucia(adapter, {
	getUserAttributes: (attributes) => {
		return {
			username: attributes.username
		};
	}
});

const { user } = await lucia.validateSession();
if (user) {
	const username = user.username;
}
```

We do not automatically expose all database columns as

1. Each project has its own code styling rules
2. You generally don't want to expose sensitive data such as hashed passwords (even worse if you send the entire user object to the client)

### Define user ID type

User IDs are typed as strings by default. You can override this by declaring `Register.UserId`.

```ts
declare module "lucia" {
	interface Register {
		Lucia: typeof lucia;
		UserId: number;
	}
}

const session = await lucia.createSession(0, {});
```
