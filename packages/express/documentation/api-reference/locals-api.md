---
order: 1
layout: "@layouts/DocumentLayout.astro"
title: "Locals API (server)"
---

These are available inside `app.locals`.

```ts
import express from "express";
const app = express();

app.get("/", () => {
	const session = app.locals.getSession();
});
```

## `clearSession()`

Deletes all session cookies stored to the user. This will **NOT** invalidate the provided session - this can be down with [`invalidateSession()`](/reference/api/server-api#invalidatesession).

```ts
import express from "express";
const app = express();

const setSession: () => void;
```

#### Example

```ts
import express from "express";
const app = express();

app.locals.clearSession();
```

## `getSession()`

Validates the request and return the current session. This method will also attempt to renew the session if it was invalid and return the new session if so.

```ts
const getSession: () => Promise<Session | null>;
```

#### Returns

| type                                                        | description               |
| ----------------------------------------------------------- | ------------------------- |
| [`Session`](/reference/types/lucia-types#session)` \| null` | `null` if unauthenticated |

#### Example

```ts
import express from "express";
const app = express();

const session = await app.locals.getSession();
```

## `getSessionUser()`

Similar to [`getSession()`](/nextjs/api-reference/locals-api#getsession) but returns both the current session and user without an additional database.

```ts
const getSessionUser: () => Promise<
	| {
			session: Session;
			user: User;
	  }
	| {
			session: null;
			user: null;
	  }
>;
```

#### Returns

| name    | type                                                        | description               |
| ------- | ----------------------------------------------------------- | ------------------------- |
| session | [`Session`](/reference/types/lucia-types#session)` \| null` | `null` if unauthenticated |
| user    | [`User`](/reference/types/lucia-types#user)` \| null`       | `null` if unauthenticated |

#### Example

```ts
import type { Action } from "@sveltejs/kit";

const action: Action = async ({ locals }) => {
	const session = locals.getSession();
	if (!session) {
		// invalid
	}
};
```

## `setSession()`

Sets the session id cookie of the provided session. When called multiple times this will only set the last provided session.

```ts
const setSession: (session: Session) => void;
```

#### Parameter

| name    | type                                              | description                   |
| ------- | ------------------------------------------------- | ----------------------------- |
| session | [`Session`](/reference/types/lucia-types#session) | The session to set to cookies |

#### Example

```ts
import express from "express";
const app = express();

app.locals.setSession(session);
```
