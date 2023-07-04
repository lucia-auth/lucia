---
_order: 4
title: "Error handling"
description: "Learn how to handle errors thrown by Lucia"
---

Errors are handled by throwing [`LuciaError`](/reference/lucia-auth/luciaerror) inside Lucia. All error messages are listed in the reference.

Using a try-catch block, the error message can be read like so:

```ts
import { LuciaError } from "lucia-auth";
import { auth } from "./lucia.js";

try {
	await auth.createUser({
		// ...
	});
} catch (e) {
	if (e instanceof LuciaError) {
		const message = e.message;
	}
}
```

However, as Lucia uses external database adapters, it cannot catch every single database error and it does not expect the adapters to do so. This means that errors that are expected (known errors - listed below) are caught and thrown using `LuciaError`, while unexpected errors, including ones related to user attributes, are handled by re-throwing the database error. This means that errors like user attributes violating foreign or unique constraints and connection errors must be handled by the user.

For example, you may have a `username` unique column inside the `user` table. If you're using Prisma and try to create a user with an existing username using `createUser()`, it will throw a Prisma error and not a `LuciaError`. This can be handled outside of Lucia or by providing an error handler to your database adapter.

```ts
import { auth } from "./lucia.js";

try {
	await auth.createUser({
		// ...
	});
} catch (e) {
	if (e instanceof Prisma.PrismaKnownClientError) {
		// check error code
	}
}
```

## Known errors

Known errors for databases related actions are:

- Duplicate key on user and key creation (`AUTH_DUPLICATE_KEY_ID`)
- Invalid user id (`AUTH_INVALID_USER_ID`)
- Invalid keys (`AUTH_INVALID_KEY_ID`)
- Expired keys (`AUTH_EXPIRED_KEY`)
- Duplicate session id on session creation and renewal (`AUTH_DUPLICATE_SESSION_ID`)
