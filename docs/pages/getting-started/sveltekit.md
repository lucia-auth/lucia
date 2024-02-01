---
title: "Getting started in Sveltekit"
---

# Getting started in Sveltekit

## Installation

Install Lucia using your package manager of your choice. While not strictly necessary, we recommend installing [Oslo](https://oslo.js.org), which Lucia is built on, for various auth utilities (which a lot of the guides use).

```
npm install lucia oslo
```

## Initialize Lucia

Import `Lucia` and initialize it with your adapter. Refer to the [Database](/database) page to learn how to set up your database and initialize the adapter. Make sure to configure the `sessionCookie` option and register your `Lucia` instance type

```ts
// src/lib/server/auth.ts
import { Lucia } from "lucia";
import { dev } from "$app/environment";

const adapter = new BetterSQLite3Adapter(db); // your adapter

export const lucia = new Lucia(adapter, {
	sessionCookie: {
		attributes: {
			// set to `true` when using HTTPS
			secure: !dev
		}
	}
});

declare module "lucia" {
	interface Register {
		Lucia: typeof lucia;
	}
}
```

## Setup hooks

We recommend setting up a handle hook to validate requests. The validated user will be available as `local.user`.

If you're curious about what's happening here, see the [Validating requests](/guides/validate-session-cookies/sveltekit) page.

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
		// sveltekit types deviates from the de-facto standard
		// you can use 'as any' too
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

Make sure sure to type `App.Locals` as well.

```ts
// src/app.d.ts
declare global {
	namespace App {
		interface Locals {
			user: import("lucia").User | null;
			session: import("lucia").Session | null;
		}
	}
}

export {};
```

## Next steps

You can learn all the concepts and APIs by reading the [Basics section](/basics/sessions) in the docs. If you prefer writing code immediately, check out the [Tutorials](/tutorials) page or the [examples repository](https://github.com/lucia-auth/examples/tree/main).

If you have any questions, [join our Discord server](https://discord.com/invite/PwrK3kpVR3)!
