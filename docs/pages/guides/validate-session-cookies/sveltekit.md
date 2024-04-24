---
title: "Validate session cookies in SvelteKit"
---

# Validate session cookies in SvelteKit

SvelteKit has basic CSRF protection by default. We recommend creating a handle hook to validate requests and store the current user inside `locals`. You can get the cookie name with `Lucia.sessionCookieName` and validate the session cookie with `Lucia.validateSession()`. Make sure to delete the session cookie if it's invalid and create a new session cookie when the expiration gets extended, which is indicated by `Session.fresh`.

```ts
// src/hooks.server.ts
import { lucia } from "$lib/server/auth";

import type { Handle } from "@sveltejs/kit";

export const handle: Handle = async ({ event, resolve }) => {
	const sessionId = event.cookies.get(lucia.sessionCookieName);
	if (!sessionId) {
		event.locals.user = null;
		event.locals.session = null;
		return resolve(event);
	}

	const { session, user } = await lucia.validateSession(sessionId);
	if (session && session.fresh) {
		const sessionCookie = lucia.createSessionCookie(session.id);
		event.cookies.set(sessionCookie.name, sessionCookie.value, {
			path: ".",
			...sessionCookie.attributes
		});
	}
	if (!session) {
		const sessionCookie = lucia.createBlankSessionCookie();
		event.cookies.set(sessionCookie.name, sessionCookie.value, {
			path: ".",
			...sessionCookie.attributes
		});
	}
	event.locals.user = user;
	event.locals.session = session;
	return resolve(event);
};
```

Make sure to type `App.Locals` as well.

```ts
// src/app.d.ts
declare global {
	namespace App {
		interface Locals {
			user: import("lucia").User;
			session: import("lucia").Session;
		}
	}
}
```

This will allow you to access the current user inside server load functions, actions, and API routes.

```ts
// +page.server.ts
import { lucia } from "$lib/server/auth";
import { fail, redirect } from "@sveltejs/kit";

import type { Actions, PageServerLoad } from "./$types";

export const load: PageServerLoad = async (event) => {
	if (!event.locals.user) {
		redirect("/login");
	}
	// ...
};

export const actions: Actions = {
	default: async (event) => {
		if (!event.locals.user) {
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
	if (!event.locals.user) {
		return new Response(null, {
			status: 401
		});
	}
	// ...
}
```
