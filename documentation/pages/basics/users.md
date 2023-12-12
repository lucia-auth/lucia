---
layout: "@components/Layout.astro"
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

When creating users, you can use `generateId()` to generate user IDs, which takes the length of the output string. This will generate a cryptographically secure random string consisting of lowercase letters and numbers.

```ts
import { generateId } from "lucia";

await db.createUser({
	id: generateId(15)
});
```

Use Oslo's [`generateRandomString()`](https://oslo.js.org/reference/random/generateRandomString/) if you're looking for a more customizable option.

```ts
import { generateRandomString, alphabet } from "oslo/random";

await db.createUser({
	id: generateRandomString(15, alphabet("a-z", "A-Z", "0-9"))
});
```

## Define user attributes

Defining custom session attributes requires 2 steps. First, add the required columns to the user table. You can type it by declaring the `DatabaseUserAttributes` type.

```ts
declare module "lucia" {
	interface Register {
		Lucia: typeof lucia;
		DatabaseUserAttributes: {
			username: string;
		};
	}
}
```

You can then include them into the user object with the `getUserAttributes()` configuration.

```ts
const lucia = new Lucia(adapter, {
	getUserAttributes: (attributes) => {
		return {
			username
		};
	}
});

const { user } = await lucia.validateSession();
if (user) {
	const username = user.username;
}
```

We do not automatically expose all database columns as

1. Each project has their code styling rules
2. You generally don't want to expose sensitive data such as hashed passwords (even worse if you send the entire user object to the client)
