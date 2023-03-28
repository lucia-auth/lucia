---
title: "Migrate to release candidate"
_order: 3
description: "Learn how to migrate to the release candidate"
---

We are super excited to announce that we have entered the release candidate phase! Nothing major except for a guarantee that we will not introduce any more major breaking changes and features.

Unfortunately, the latest version introduces tons of small breaking changes that adds up.

Most of these changes are things we just wanted to get over with early. It sucks but it's going to suck more if we do it later on.

### Latest versions

- `lucia-auth`: 0.11.0
- `@lucia-auth/adapter-prisma`: 0.7.0
- `@lucia-auth/adapter-mongoose`: 0.7.0
- `@lucia-auth/adapter-kysely`: 0.8.0
- `@lucia-auth/adapter-session-kysely`: 0.1.7
- `@lucia-auth/adapter-test`: 0.6.0
- `@lucia-auth/oauth`: 0.8.0
- `@lucia-auth/tokens`: 0.3.0

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
const session = await authRequest.validate();
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
	type Locals = import("lucia-auth").AuthRequest;
}
```

### Next.js migration

Replace `new AuthRequest()`:

```ts
const authRequest = auth.handleRequest(request, response);
```

### Astro migration

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

Refer to [the database migration guide](https://github.com/pilcrowOnPaper/lucia/discussions/435) for specifics.

## API name changes

`Auth` methods:

- Rename `Auth.validateRequestHeaders()` to `Auth.parseRequestHeaders()`
- Replace `Auth.createSessionCookies()` with `Auth.createSessionCookie()` (singular)

All properties starting with `is` (`isExpired` etc) has had `is` removed (`expired` etc) to be more consistent with the JS/Node ecosystem, and `expires` has been renamed to `expiresAt` or `expiresIn` to be more consistent across packages.

TypeScript should be able to detect most, if not all, of these changes.
