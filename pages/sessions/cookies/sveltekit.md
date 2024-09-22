---
title: "Session cookies in SvelteKit"
---

# Session cookies in SvelteKit

[Basic session API]_This page builds upon the API defined in the [Basic session API](/sessions/basic-api) page._

## Cookies

CSRF protection is a must when using cookies. SvelteKit has basic CSRF protection using the `Origin` header is enabled by default.

Session cookies should have the following attributes:

- `HttpOnly`: Cookies are only accessible server-side
- `SameSite=Lax`: Use `Strict` for critical websites
- `Secure`: Cookies can only be sent over HTTPS (Should be omitted when testing on localhost)
- `Max-Age` or `Expires`: Must be defined to persist cookies
- `Path=/`: Cookies can be accessed from all routes

SvelteKit automatically sets the `Secure` flag when deployed to production.

```ts
import type { RequestEvent } from "@sveltejs/kit";

// ...

export async function createSession(userId: number): Promise<Session> {
	// ...
}

export async function validateSession(sessionId: string): Promise<SessionValidationResult> {
	// ...
}

export async function invalidateSession(sessionId: string): Promise<void> {
	// ...
}

export function setSessionCookie(event: RequestEvent, session: Session): void {
	context.cookies.set("session", session.id, {
		httpOnly: true,
		sameSite: "lax",
		expires: session.expiresAt,
		path: "/"
	});
}

export function deleteSessionCookie(event: RequestEvent): void {
	context.cookies.set("session", "", {
		httpOnly: true,
		sameSite: "lax",
		maxAge: 0,
		path: "/"
	});
}
```

## Session validation

Sessions can be validated by getting the cookie and using the `validateSession()` function we created. If the session is invalid, delete the session cookie. Importantly, we recommend setting a new session cookie after validation to persist the cookie for an extended time.

```ts
// +page.server.ts
import { fail, redirect } from "@sveltejs/kit";
import { validateSession, deleteSessionCookie, setSessionCookie } from "$lib/server/auth";

import type { Actions, PageServerLoad } from "./$types";

export const load: PageServerLoad = async (event) => {
	if (event.locals.user === null) {
		redirect("/login");
	}
	// ...
};
```

We recommend handling session validation in the handle hook and passing the current auth context to each route.

```ts
// src/app.d.ts

declare global {
	namespace App {
		// Note: 'import {} from ""' syntax does not work in .d.ts files.
		interface Locals {
			session: import("./lib/server/auth").Session | null;
			user: import("./lib/server/auth").User | null;
		}
	}
}

export {};
```

```ts
// src/hooks.server.ts
import { validateSession, setSessionCookie, deleteSessionCookie } from "./lib/server/auth";

import type { Handle } from "@sveltejs/kit";

export const handle: Handle = async ({ event, resolve }) => {
	const sessionId = event.cookies.get("session") ?? null;
	if (sessionId === null) {
		event.locals.user = null;
		event.locals.session = null;
		return next();
	}

	const { session, user } = await validateSession(sessionId);
	if (session !== null) {
		setSessionCookie(event, session);
	} else {
		deleteSessionCookie(event);
	}

	event.locals.session = session;
	event.locals.user = user;
	return next();
};
```

Both the current user and session will be available in loaders, actions, and endpoints.

```ts
// +page.server.ts
import { fail, redirect } from "@sveltejs/kit";

import type { Actions, PageServerLoad } from "./$types";

export const load: PageServerLoad = async (event) => {
	if (event.locals.user === null) {
		redirect("/login");
	}
	// ...
};

export const actions: Actions = {
	default: async (event) => {
		if (event.locals.user === null) {
			throw fail(401);
		}
		// ...
	}
};
```

```ts
// +server.ts
import { lucia } from "$lib/server/auth";

export function GET(event: RequestEvent): Promise<Response> {
	if (event.locals.user === null) {
		return new Response(null, {
			status: 401
		});
	}
	// ...
}
```
