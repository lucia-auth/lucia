---
title: "Getting started in Sveltekit"
---

# Getting started in Sveltekit

## Installation

Install Lucia using your package manager of your choice, for example with npm:

```
npm install -D lucia
```

In this quickstart, we use the [SQLite adapter](/database/sqlite), but you can easily substitute another adapter:

```
npm install -D @lucia-auth/adapter-sqlite
```

Refer to the [Database](/database) page to learn how to set up your database and initialize the appropriate adapter.

## Initialize Lucia

Import Lucia, your adapter and the database and initialize them:

```ts
// src/lib/server/auth.ts
import { Lucia } from "lucia";
import { BetterSqlite3Adapter } from "@lucia-auth/adapter-sqlite";
import { dev } from "$app/environment";
import { db } from './db';

// configure adapter database and auth tables
const adapter = new BetterSqlite3Adapter(db, {
	user: "user",
	session: "session"
});

// configure the session cookie behavior
export const lucia = new Lucia(adapter, {
	sessionCookie: {
		attributes: {
			secure: !dev // 'true' when using HTTPS
		}
	}
});

// register your 'Lucia' instance type
declare module "lucia" {
	interface Register {
		Lucia: typeof lucia;
	}
}
```

## Setup hooks

We recommend setting up a handle hook to validate requests. This ensures that every time a SvelteKit route is accessed, the user and session state is validated, updated and made available throughout the app as `locals.user` and `locals.session`:

```ts
// src/hooks.server.ts
import { lucia } from "$lib/server/auth";
import type { Handle } from "@sveltejs/kit";

export const handle: Handle = async ({ event, resolve }) => {
	// get the cookie
	const sessionId = event.cookies.get(lucia.sessionCookieName);
	// do nothing if no cookie is found
	if (!sessionId) {
		event.locals.user = null;
		event.locals.session = null;
		return resolve(event);
	}
	// load the session if a cookie is found
	const { session, user } = await lucia.validateSession(sessionId);
	// recover existing session if it exists
	if (session && session.fresh) {
		const sessionCookie = lucia.createSessionCookie(session.id);
		// SvelteKit types are non-standard: you can use 'as any' too
		event.cookies.set(sessionCookie.name, sessionCookie.value, {
			path: ".",
			...sessionCookie.attributes
		});
	}
	// create a new session if it doesn't
	if (!session) {
		const sessionCookie = lucia.createBlankSessionCookie();
		event.cookies.set(sessionCookie.name, sessionCookie.value, {
			path: ".",
			...sessionCookie.attributes
		});
	}
	// set the locals and return
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
			user: import("lucia").User | null;
			session: import("lucia").Session | null;
		}
	}
}

export {};
```
If you want to learn more about what's happening in `hook.server.ts`, see the [validating requests](/guides/validate-session-cookies/sveltekit) page in the SvelteKit docs.

## Next steps

You can learn all the concepts and APIs by reading the [Basics section](/basics/sessions) in the docs. If you prefer writing code immediately, check out the [Tutorials](/tutorials) page or the [examples repository](https://github.com/lucia-auth/examples/tree/main).

This documentation often references [the Copenhagen Book](https://thecopenhagenbook.com). This is an open-source guide on implementing auth and should come in handy when implementing anything auth, including passkeys, multi-factor authentication, and a bit of cryptography. We recommend reading it to learn more about auth in web applications.

If you have any questions, [join our Discord server](https://discord.com/invite/PwrK3kpVR3)!
