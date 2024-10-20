---
title: "Session cookies in Astro"
---

# Session cookies in Astro

_This page builds upon the API defined in the [Basic session API](/sessions/basic-api) page._

## CSRF protection

CSRF protection is a must when using cookies. From Astro v5.0, basic CSRF protection using the `Origin` header is enabled by default. If you're using Astro v4, you must manually enable it by updating the config file.

```ts
// astro.config.mjs
export default defineConfig({
	output: "server",
	security: {
		checkOrigin: false
	}
});
```

## Cookies

Session cookies should have the following attributes:

- `HttpOnly`: Cookies are only accessible server-side
- `SameSite=Lax`: Use `Strict` for critical websites
- `Secure`: Cookies can only be sent over HTTPS (Should be omitted when testing on localhost)
- `Max-Age` or `Expires`: Must be defined to persist cookies
- `Path=/`: Cookies can be accessed from all routes

> Lucia v3 used `auth_session` as the session cookie name.

```ts
import type { APIContext } from "astro";

// ...

export function setSessionTokenCookie(context: APIContext, token: string, expiresAt: Date): void {
	context.cookies.set("session", token, {
		httpOnly: true,
		sameSite: "lax",
		secure: import.meta.env.PROD,
		expires: expiresAt,
		path: "/"
	});
}

export function deleteSessionTokenCookie(context: APIContext): void {
	context.cookies.set("session", "", {
		httpOnly: true,
		sameSite: "lax",
		secure: import.meta.env.PROD,
		maxAge: 0,
		path: "/"
	});
}
```

## Session validation

Sessions can be validated by getting the cookie and using the `validateSessionToken()` function we created. If the session is invalid, delete the session cookie. Importantly, we recommend setting a new session cookie after validation to persist the cookie for an extended time.

```ts
import {
	validateSessionToken,
	setSessionTokenCookie,
	deleteSessionTokenCookie
} from "$lib/server/session";

import type { APIContext } from "astro";

export async function GET(context: APIContext): Promise<Response> {
	const token = context.cookies.get("session")?.value ?? null;
	if (token === null) {
		return new Response(null, {
			status: 401
		});
	}

	const { session, user } = await validateSessionToken(token);
	if (session === null) {
		deleteSessionTokenCookie(context);
		return new Response(null, {
			status: 401
		});
	}
	setSessionTokenCookie(context, token, session.expiresAt);

	// ...
}
```

We recommend handling session validation in middleware and passing the current auth context to each route.

```ts
// src/env.d.ts

/// <reference types="astro/client" />
declare namespace App {
	// Note: 'import {} from ""' syntax does not work in .d.ts files.
	interface Locals {
		session: import("./lib/server/session").Session | null;
		user: import("./lib/server/session").User | null;
	}
}
```

```ts
// src/middleware.ts
import {
	validateSession,
	setSessionTokenCookie,
	deleteSessionTokenCookie
} from "./lib/server/session";
import { defineMiddleware } from "astro:middleware";

export const onRequest = defineMiddleware(async (context, next) => {
	const token = context.cookies.get("session")?.value ?? null;
	if (token === null) {
		context.locals.user = null;
		context.locals.session = null;
		return next();
	}

	const { session, user } = await validateSessionToken(token);
	if (session !== null) {
		setSessionTokenCookie(context, token, session.expiresAt);
	} else {
		deleteSessionTokenCookie(context);
	}

	context.locals.session = session;
	context.locals.user = user;
	return next();
});
```

Both the current user and session will be available in Astro files and API endpoints.

```ts
---
if (Astro.locals.user === null) {
    return Astro.redirect("/login")
}
---
```

```ts
export function GET(context: APIContext): Promise<Response> {
	if (context.locals.user === null) {
		return new Response(null, {
			status: 401
		});
	}
	// ...
}
```
