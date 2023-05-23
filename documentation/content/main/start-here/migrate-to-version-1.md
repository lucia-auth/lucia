---
title: "Migrate to version 1.0"
_order: 3
description: "Learn how to migrate to Lucia version 1.0"
---

We are super excited to announce that we have finally reached version 1.0!

Most of these changes are things we just wanted to get over with early. It sucks but it's going to suck more if we do it later on.

This guide covers migration from v0.10.x to v1.0.0. If you are using v0.11.x, no changes are required on your part unless you're using Next.js (see Next.js migration guide).

### Latest versions

- `lucia-auth`: 1.0.0
- `@lucia-auth/adapter-prisma`: 1.0.0
- `@lucia-auth/adapter-mongoose`: 1.0.0
- `@lucia-auth/adapter-kysely`: 1.0.1
- `@lucia-auth/adapter-session-redis`: 1.0.0
- `@lucia-auth/adapter-test`: 1.0.0
- `@lucia-auth/oauth`: 1.0.0
- `@lucia-auth/tokens`: 1.0.0

## Deprecate framework integrations

Maintaining all the framework specific packages and documentation were becoming a burden and slowing down development. With version 0.11.0, Lucia no longer provides framework packages and introduces...

### Middleware

Middlewares are similar to database adapters but for frameworks, and they are already provided by the core package.

```ts
import { node } from "lucia-auth/middleware";
import lucia from "lucia-auth";

export const auth = lucia({
	// ...
	middleware: node() // default
});
```

```ts
const authRequest = auth.handleRequest(request, response);
const { user, session } = await authRequest.validateUser();
```

We hope this makes it much more easier to support other frameworks.

### SvelteKit migration

With this update, `getUser()` and other SvelteKit specific functions are no longer provided. You can get the same `locals` methods with:

```ts
import { sveltekit } from "lucia-auth/middleware";
import lucia from "lucia-auth";

export const auth = lucia({
	// ...
	middleware: sveltekit()
});
```

```ts
// hooks.server.ts
import { auth } from "$lib/server/lucia";
import type { Handle } from "@sveltejs/kit";

export const handle: Handle = async ({ event, resolve }) => {
	event.locals = auth.handleRequest(event);
	return await resolve(event);
};
```

```ts
// app.d.ts
/// <reference types="@sveltejs/kit" />
declare namespace App {
	type AuthRequest = import("lucia-auth").AuthRequest;
	// Locals must be an interface and not a type
	// eslint-disable-next-line @typescript-eslint/no-empty-interface
	interface Locals extends AuthRequest {}
}
```

### Next.js migration

Add Node middleware (**new in v1.0**):

```ts
// astro
import { node } from "lucia-auth/middleware";
import lucia from "lucia-auth";

export const auth = lucia({
	// ...
	middleware: node()
});
```

Replace `new AuthRequest()`:

```ts
const authRequest = auth.handleRequest(request, response);
```

### Astro migration

Add Astro middleware:

```ts
// astro
import { astro } from "lucia-auth/middleware";
import lucia from "lucia-auth";

export const auth = lucia({
	// ...
	middleware: astro()
});
```

Replace `new AuthRequest()`:

```ts
// index.astro
const authRequest = auth.handleRequest(Astro);
```

## Update database schema

A lot of SQL databases seemed to have issues with `user`, `key`, and `primary`. All database names are now preceded with `auth_` (`auth_user` etc). Column `auth_key.primary` has been renamed to `auth_key.primary_key`.

Refer to the [database migration guide](https://github.com/pilcrowOnPaper/lucia/discussions/435) for specifics.

## Update config

Replace `transformUserData()` config with `transformDatabaseUser()`. "user data" wasn't a really good name could represent anything.

```ts
export const auth = lucia({
	transformDatabaseUser: (databaseUser) => {
		return {
			// ...
		};
	}
});
```

## API name changes

`Auth` methods:

- Rename `Auth.validateRequestHeaders()` to `Auth.parseRequestHeaders()`
- Replace `Auth.createSessionCookies()` with `Auth.createSessionCookie()` (singular)

All properties starting with `is` (`isExpired` etc) has had `is` removed (`expired` etc) to be more consistent with the JS/Node ecosystem, and `expires` has been renamed to `expiresAt` or `expiresIn` to be more consistent across packages.

TypeScript should be able to detect most, if not all, of these changes.

## Polyfill `crypto` global

**This is only required for Node.js v16-18.** Import `lucia-auth/polyfill/node` in `lucia.ts`.

```ts
// auth/lucia.ts
import lucia from "lucia-auth";
import "lucia-auth/polyfill/node";

// ...

export const auth = lucia({
	adapter: prisma(prismaClient),
	env: "DEV", // "PROD" if prod
	middleware: node()
});

export type Auth = typeof auth;
```

Alternatively, add the `--experimental-global-webcrypto` flag when running `node`:

```
node --experimental-global-webcrypto index.js
```

### Next.js

Alternatively, add the `--experimental-global-webcrypto` flag to the `dev` and `build` command:

```json
{
	// ...
	"scripts": {
		"dev": "NODE_OPTIONS=--experimental-global-webcrypto next dev",
		"start": "NODE_OPTIONS=--experimental-global-webcrypto next start"
		// ...
	}
	// ...
}
```
