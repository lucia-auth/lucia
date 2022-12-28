---
_order: 1
title: "Locals API (server)"
---

These are available inside `locals` from SvelteKit's `ServerRequest`.

```ts
import type { Action } from "@sveltejs/kit";

const action: Action = async ({ locals }) => {
	const session = locals.validate();
};
```

### Caching

Methods that returns some data, specifically [`validate()`](/sveltekit/api-reference/locals-api#validate) and [`validateUser()`](/sveltekit/api-reference/locals-api#validateuser), will cache its result on initial call. This means that within a single request (page load), the session will only be validated once, and thus only a single database call made, regardless of how many times the function is called. If `validateUser()` was used first, `validate()` will use the cache from it. When used within load functions, it allows you to get the current session without awaiting for the parent load function and sending another database call, improving page loads.

## `validate()`

Validates the request and return the current session. This method will also attempt to renew the session if it was invalid and return the new session if so.

```ts
const validate: () => Promise<Session | null>;
```

#### Returns

| type                                                        | description               |
| ----------------------------------------------------------- | ------------------------- |
| [`Session`](/reference/types/lucia-types#session)` \| null` | `null` if unauthenticated |

#### Example

```ts
import type { Action } from "@sveltejs/kit";

const action: Action = async ({ locals }) => {
	const session = locals.validate();
	if (!session) {
		// invalid
	}
};
```

## `validateUser()`

Similar to [`validate()`](/sveltekit/api-reference/locals-api#validate) but returns both the current session and user without an additional database.

```ts
const validateUser: () => Promise<
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
	const session = locals.validate();
	if (!session) {
		// invalid
	}
};
```

## `setSession()`

Sets the session id cookie of the provided session, or if `null`, removes all session cookies. This will NOT invalidate the current session if the input is `null` - this can be down with [`invalidateSession()`](/reference/api/server-api#invalidatesession).

```ts
const setSession: (session: Session | null) => void;
```

#### Parameter

| name    | type                                                        | description        |
| ------- | ----------------------------------------------------------- | ------------------ |
| session | [`Session`](/reference/types/lucia-types#session)` \| null` | the session to set |

#### Example

```ts
import { auth } from "$lib/server/lucia";
import type { Action } from "@sveltejs/kit";

const action: Action = async ({ locals }) => {
	const session = await auth.createSession();
	locals.setSession(session);
};
```
