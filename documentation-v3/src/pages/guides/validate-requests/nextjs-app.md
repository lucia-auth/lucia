---
layout: "@layouts/DocLayout.astro"
title: "Validate requests in Next.js App router"
---

Next.js throws an error when you attempt to set a cookie when rendering the component, so we unfortunately have to write and use 2 different functions for validating requests. This is a known issue but Vercel has yet to acknowledge or fix the issue.

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

Next.js implements basic CSRF protection for server actions. Make sure to delete the session cookie if it's invalid and create a new session cookie when the expiration gets extended, which is indicated by `Session.fresh`.

```ts
import { lucia } from "@/utils/auth";
import { cookies } from "next/headers";

import type { User } from "lucia";

async function validateRequest(): Promise<User | null> {
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

Since Next.js do not implement CSRF protection for API routes, **CSRF protection must be implemented for non-GET requests**, including POST requests, if you're dealing with forms. This can be easily done by comparing the `Origin` and `Host` header. You may want to add the CSRF protection inside middleware.

```ts
import { headers } from "next/headers";
import { verifyRequestOrigin } from "oslo/request";

function validateRequestOrigin(): boolean {
	const originHeader = request.headers.get("Origin");
	const hostHeader = request.headers.get("Host");
	if (!originHeader || !hostHeader) {
		return false;
	}
	return verifyRequestOrigin(originHeader, [hostHeader]);
}
```

```ts
// app/api/route.ts
export async function POST(request: NextRequest) {
	const validRequestOrigin = validateRequestOrigin();
	if (!validRequestOrigin) {
		return new Response(null, {
			status: 403
		});
	}
	const user = await validateRequest();
	if (!user) {
		return new Response(null, {
			status: 401
		});
	}
	//
}
```
