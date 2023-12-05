---
layout: "@layouts/DocLayout.astro"
title: "Validate session cookies in Next.js App router"
---

Next.js throws an error when you attempt to set a cookie when rendering components, so we unfortunately have to write 2 different functions for validating requests. This is a known issue but Vercel has yet to acknowledge or fix the issue.

This also means you'll need to set `sessionCookie.expires` option to `false` so the session cookie persists for a long time.

```ts
import { Lucia } from "lucia";

const lucia = new Lucia(adapter, {
	sessionCookie: {
		expires: false,
		attributes: {
			// set to `true` when using HTTPS
			secure: process.env.NODE_ENV === "production"
		}
	}
});
```

## Server components

You can get the cookie name with `Lucia.sessionCookieName` and validate the session cookie with `Lucia.validateSession()`. We recommend wrapping the function with [`cache()`]() so it can be called multiple times without incurring multiple database calls.

```ts
import { lucia } from "@/utils/auth";
import { cookies } from "next/headers";

const validatePageRequest = cache(async () => {
	const sessionId = cookies().get(lucia.sessionCookieName);
	if (!sessionId) return null;
	const { user } = await lucia.validateSession(sessionId);
	return user;
});
```

```ts
// app/api/page.tsx
import { redirect } from "next/navigation";

async function Page() {
	const user = await validatePageRequest();
	if (!user) {
		redirect("/login");
	}
	// ...
}
```

## Server actions and API routes

Make sure to delete the session cookie if it's invalid and create a new session cookie when the expiration gets extended, which is indicated by `Session.fresh`.

Since Next.js do not implement CSRF protection for API routes, **CSRF protection must be implemented for non-GET requests**, including POST requests, if you're dealing with forms. This can be easily done by comparing the `Origin` and `Host` header. You may want to add the CSRF protection inside middleware.

If you're only using server actions, you can remove the CSRF check.

```ts
import { lucia } from "@/utils/auth";
import { cookies, headers } from "next/headers";

import type { User } from "lucia";

async function validateRequest(): Promise<User | null> {
	const originHeader = headers().get("Origin");
	const hostHeader = headers().get("Host");
	if (!originHeader || !hostHeader) {
		return null;
	}
	// check if the hostname matches
	// to allow more domains, add them into the array
	const validRequestOrigin = verifyRequestOrigin(originHeader, [hostHeader]);
	if (!validRequestOrigin) {
		return null;
	}

	const sessionId = cookies().get(lucia.sessionCookieName);
	if (!sessionId) return null;
	const { session, user } = await lucia.validateSession(sessionId);
	if (session && session.fresh) {
		// update session expiration
		const sessionCookie = lucia.createSessionCookie(session.id);
		cookies().set(sessionCookie.name, sessionCookie.value, sessionCookie.attributes);
	}
	if (!session) {
		// delete session cookie if invalid
		const sessionCookie = lucia.createBlankSessionCookie();
		cookies().set(sessionCookie.name, sessionCookie.value, sessionCookie.attributes);
	}
	return user;
}
```

```ts
// app/api/page.tsx
import { redirect } from "next/navigation";

async function Page() {
	async function action() {
		"use server";
		const user = await validateRequest();
		if (!user) {
			redirect("/login");
		}
		// ...
	}
	// ...
}
```

```ts
// app/api/route.ts
export async function POST(request: NextRequest) {
	const user = await validateRequest();
	if (!user) {
		return new Response(null, {
			status: 401
		});
	}
	//
}
```
