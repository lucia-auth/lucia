---
_order: 0
title: "Server API"
---

These can be imported from `@lucia-auth/astro` and should only be used inside a server context.

```ts
import { AuthRequest } from "@lucia-auth/astro";
```

## `AuthRequest`

The methods for the instance are listed below.

```ts
const constructor: (
	auth: Auth,
	context: {
		request: Request;
		cookies: AstroCookie;
	}
) => AuthRequest;
```

#### Parameter

| name            | type                                                                                 | description                                                                                                                                                                        |
| --------------- | ------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| auth            | [`Auth`](/reference/types/lucia-types#auth)                                          | Lucia instance                                                                                                                                                                     |
| context.request | [`Request` ](https://developer.mozilla.org/en-US/docs/Web/API/Request)               | request from [`Astro`](https://docs.astro.build/en/reference/api-reference/#astro-global) or [`APIContext`](https://docs.astro.build/en/reference/api-reference/#endpoint-context) |
| context.cookies | [`Astro.cookies`](https://docs.astro.build/en/reference/api-reference/#astrocookies) | Astro's `cookies` from `Astro` or `APIContext`                                                                                                                                     |

#### Example

```astro
---
import { auth } from "../lib/lucia";
import { AuthRequest } from "@lucia-auth/astro";

const authRequest = new AuthRequest(auth, Astro);
---
```

```ts
import { AuthRequest } from "@lucia-auth/astro";
import { auth } from "../../lib/lucia";
import type { APIRoute } from "astro";

export const post: APIRoute = async (context) => {
	const authRequest = new AuthRequest(auth, context);
	// ...
};
```

### `validate()`

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
const authRequest = new AuthRequest();
const session = await authRequest.validate();
if (session) {
	// authenticated
}
```

### `validateUser()`

Similar to [`validate()`](#validate) but returns both the current session and user without an additional database.

```ts
const authRequest = new AuthRequest();
const { session, user } = await authRequest.validateUser();
if (session) {
	// authenticated
}
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

### `setSession()`

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
import { auth } from "../lucia";

const authRequest = new AuthRequest();
const session = await auth.createSession();
authRequest.setSession(session); // set session cookie
```

```ts
import { auth } from "../lucia";

const authRequest = new AuthRequest();
await auth.invalidateSession(sessionId); // invalidate session
authRequest.setSession(null); // remove session cookies
```

## `handleLogoutRequests()`

Returns an Astro api route handler that handles sign outs. Must be used as a POST request handler.

```ts
const handleApiRoutes: (auth: Auth) => APIRoute;
```

#### Parameter

| name | type                                        | description    |
| ---- | ------------------------------------------- | -------------- |
| auth | [`Auth`](/reference/types/lucia-types#auth) | Lucia instance |

#### Returns

| type                                                                                           | description             |
| ---------------------------------------------------------------------------------------------- | ----------------------- |
| [`APIRoute`](https://docs.astro.build/en/core-concepts/endpoints/#server-endpoints-api-routes) | Astro API route handler |
