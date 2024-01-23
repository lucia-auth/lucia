---
title: "Validate session cookies in Next.js App router"
---

# Validate session cookies in Next.js App router

You can get the cookie name with `Lucia.sessionCookieName` and validate the session cookie with `Lucia.validateSession()`. Delete the session cookie if it's invalid and create a new session cookie when the expiration gets extended, which is indicated by `Session.fresh`. We have to wrap it inside a try/catch block since Next.js doesn't allow you to set cookies when rendering the page. This is a known issue but Vercel has yet to acknowledge or address the issue.

We recommend wrapping the function with [`cache()`](https://nextjs.org/docs/app/building-your-application/caching#react-cache-function) so it can be called multiple times without incurring multiple database calls.

**CSRF protection is only handled by Next.js when using form actions.** If you're using API routes, it must be implemented by yourself (see below).

```ts
import { lucia } from "@/utils/auth";
import { cookies } from "next/headers";

const getUser = cache(async () => {
	const sessionId = cookies().get(lucia.sessionCookieName)?.value ?? null;
	if (!sessionId) return null;
	const { user, session } = await lucia.validateSession(sessionId);
	try {
		if (session && session.fresh) {
			const sessionCookie = lucia.createSessionCookie(session.id);
			cookies().set(sessionCookie.name, sessionCookie.value, sessionCookie.attributes);
		}
		if (!session) {
			const sessionCookie = lucia.createBlankSessionCookie();
			cookies().set(sessionCookie.name, sessionCookie.value, sessionCookie.attributes);
		}
	} catch {
		// Next.js throws error when attempting to set cookies when rendering page
	}
	return user;
});
```

Set `sessionCookie.expires` option to `false` so the session cookie persists for a longer period.

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

You can now use `getUser()` in server components, including server actions.

```ts
// app/api/page.tsx
import { redirect } from "next/navigation";

async function Page() {
	const user = await getUser();
	if (!user) {
		redirect("/login");
	}
	// ...
	async function action() {
		"use server";
		const user = await getUser();
		if (!user) {
			redirect("/login");
		}
		// ...
	}
	// ...
}
```

For API routes, since Next.js does not implement CSRF protection for API routes, **CSRF protection must be implemented when dealing with forms** if you're dealing with forms. This can be easily done by comparing the `Origin` and `Host` header. We recommend using middleware for this.

```ts
// middleware.ts
import { verifyRequestOrigin } from "lucia";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export async function middleware(request: NextRequest): Promise<NextResponse> {
	if (request.method === "GET") {
		return NextResponse.next();
	}
	const originHeader = request.headers.get("Origin");
	// NOTE: You may need to use `X-Forwarded-Host` instead
	const hostHeader = request.headers.get("Host");
	if (!originHeader || !hostHeader || !verifyRequestOrigin(originHeader, [hostHeader])) {
		return new NextResponse(null, {
			status: 403
		});
	}
	return NextResponse.next();
}
```
