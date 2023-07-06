---
order: 3
title: "Error handling"
description: "Learn about how to handle errors in Lucia"
---

Errors in Lucia are thrown as [`LuciaError`](/reference/lucia/main#luciaerror), which extends the standard `Error`. See the API reference for a full list of errors. Alternatively, the API reference for each API methods list possible errors it could throw.

Using a try-catch block, the error message can be read like so:

```ts
import { LuciaError } from "lucia";

try {
	// some action
} catch (e) {
	if (e instanceof LuciaError) {
		const message = e.message;
	}
}
```

However, Lucia is made to be used with any databases and heavily relies on adapters. As each database handles errors in different ways, Lucia does not expect adapters to handle every single database errors. Errors such as connection errors, and most notably, user and session attributes violating some database rule (e.g. unique constraint), are handled by re-throwing the database error thrown by the adapter. For example, if you're using the Prisma adapter, Lucia will throw both `LuciaError` and Prisma errors.

```ts
import { auth } from "./lucia.js";

try {
	await auth.createUser({
		attributes: {
			uniqueField: valueThatAlreadyExists
		}
	});
} catch (e) {
	// violates unique constraint!
}
```
