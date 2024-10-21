---
title: "Next.js"
---

# Session cookies in Next.js

_This page builds upon the API defined in the [Basic session API](/sessions/basic-api) page._

## CSRF protection

CSRF protection is a must when using cookies. While Next.js provides built-in CSRF protection for server actions, regular route handlers are not protected. As such, we recommend implementing CSRF protection globally via middleware as a precaution.

```ts
// middleware.ts
import { NextResponse } from "next/server";

import type { NextRequest } from "next/server";

export async function middleware(request: NextRequest): Promise<NextResponse> {
	if (request.method === "GET") {
		return NextResponse.next();
	}
	const originHeader = request.headers.get("Origin");
	// NOTE: You may need to use `X-Forwarded-Host` instead
	const hostHeader = request.headers.get("Host");
	if (originHeader === null || hostHeader === null) {
		return new NextResponse(null, {
			status: 403
		});
	}
	let origin: URL;
	try {
		origin = new URL(originHeader);
	} catch {
		return new NextResponse(null, {
			status: 403
		});
	}
	if (origin.host !== hostHeader) {
		return new NextResponse(null, {
			status: 403
		});
	}
	return NextResponse.next();
}
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
import { cookies } from "next/headers";

// ...

export function setSessionTokenCookie(token: string, expiresAt: Date): void {
	cookies().set("session", token, {
		httpOnly: true,
		sameSite: "lax",
		secure: process.env.NODE_ENV === "production",
		expires: expiresAt,
		path: "/"
	});
}

export function deleteSessionTokenCookie(): void {
	cookies().set("session", "", {
		httpOnly: true,
		sameSite: "lax",
		secure: process.env.NODE_ENV === "production",
		maxAge: 0,
		path: "/"
	});
}
```

Since we can't extend set cookies insides server components due to a limitation with React, we recommend continuously extending the cookie expiration inside middleware. However, this comes with its own issue. We can't detect if a new cookie was set inside server actions or route handlers from middleware. This becomes an issue if we need to assign a new session inside server actions (e.g. after updating the password) as the middleware cookie will override it. As such, we'll only extend the cookie expiration on GET requests.

> While Lucia v3 recommended setup extended session cookie lifetime, it did not avoid the revalidation issue.

```ts
// middleware.ts
import { NextResponse } from "next/server";

import type { NextRequest } from "next/server";

export async function middleware(request: NextRequest): Promise<NextResponse> {
	if (request.method === "GET") {
		const response = NextResponse.next();
		const token = request.cookies.get("session")?.value ?? null;
		if (token !== null) {
			// Only extend cookie expiration on GET requests since we can be sure
			// a new session wasn't set when handling the request.
			response.cookies.set("session", token, {
				path: "/",
				maxAge: 60 * 60 * 24 * 30,
				sameSite: "lax",
				httpOnly: true,
				secure: process.env.NODE_ENV === "production"
			});
		}
		return response;
	}

	// CSRF protection

	return NextResponse.next();
}
```

## Session validation

Session tokens can be validated using the `validateSessionToken()` function from the [Basic session API](/sessions/basic-api/) page.

```ts
import { validateSessionToken } from "$lib/server/session";

import type { NextRequest } from "next/server";

export async function GET(request: NextRequest): Promise<Response> {
	const token = request.cookies.get("session")?.value ?? null;
	if (token === null) {
		return new Response(null, {
			status: 401
		});
	}

	const { session, user } = await validateSessionToken(token);
	if (session === null) {
		return new Response(null, {
			status: 401
		});
	}

	// ...
}
```

We recommend creating a reusable `getCurrentSession()` function that wraps the validation logic with `cache()` so it can be called multiple times without incurring multiple database calls.

```ts
import { cookies } from "next/headers";
import { cache } from "react";

// ...

export const getCurrentSession = cache(async (): Promise<SessionValidationResult> => {
	const token = cookies().get("session")?.value ?? null;
	if (token === null) {
		return { session: null, user: null };
	}
	const result = await validateSessionToken(token);
	return result;
});
```

This function can be used in server components, server actions, and route handlers (but importantly not middleware).

```ts
// app/api/page.tsx
import { redirect } from "next/navigation";

async function Page() {
	const { user } = await getCurrentSession();
	if (user === null) {
		return redirect("/login");
	}

	async function action() {
		"use server";
		const { user } = await getCurrentSession();
		if (user === null) {
			return redirect("/login");
		}
		// ...
	}
	// ...
}
```
