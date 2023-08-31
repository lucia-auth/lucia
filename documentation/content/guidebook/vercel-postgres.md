---
title: "Using `@vercel/postgres`"
description: "Learn how to use `@vercel/postgres` with Lucia"
---

`@vercel/postgres` can be used as a drop-in replacement for [`pg`](https://github.com/brianc/node-postgres). This means that it can be used with Lucia using the [`pg` adapter](/database-adapters/pg). Make sure to pass `db`, which is the equivalent to `Pool` in `pg`, since the adapter needs to have access to transactions.

```ts
import { db } from "@vercel/postgres";

export const auth = lucia({});
```

## Errors

Unfortunately, `@vercel/postgres` does not export an error class that can be used to check for database errors. Nor are the error types or messages documented, though it's the same as `@neondatabase/serverless`. However, the error codes are PostgreSQL error codes, which are [well documented](https://www.postgresql.org/docs/current/errcodes-appendix.html).

```ts
type VercelPostgresError = {
	code: string;
	detail: string;
	schema?: string;
	table?: string;
	column?: string;
	dataType?: string;
	constraint?: "auth_user_username_key";
};
```

```ts
try {
	// ...
} catch (e) {
	const maybeVercelPostgresError = (
		typeof e === "object" ? e : {}
	) as Partial<VercelPostgresError>;

	// error code for unique constraint violation
	if (maybeVercelError.code === "23505") {
		// ...
	}
}
```
