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
		secure: import.meta.env.PROD,
		maxAge: 0,
		path: "/"
	});
}
```

Since we can't extend set cookies insides server components due to a limitation with React, we recommend continuously extending the cookie expiration inside middleware.

```ts
// middleware.ts
import { NextResponse } from "next/server";
import { cookies } from "next/headers";

import type { NextRequest } from "next/server";

export async function middleware(request: NextRequest): Promise<NextResponse> {
	const token = cookies().get("session")?.value ?? null;
	if (token !== null) {
		// Not using `setSessionCookie()` to avoid accidentally importing Node-only modules.
		cookies().set("session", token, {
			httpOnly: true,
			sameSite: "lax",
			secure: process.env.NODE_ENV === "production",
			maxAge: 60 * 60 * 24 * 30, // 30 days
			path: "/"
		});
	}

	// CSRF protection, etc

	return NextResponse.next();
}
```

## Session validation

Sessions can be validated by getting the cookie and using the `validateSessionToken()` function we created.

```ts
import { validateSessionToken } from "$lib/server/auth";

import type { APIContext } from "astro";

export async function GET(context: APIContext): Promise<Response> {
	const token = cookies().get("session")?.value ?? null;
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

We recommend creating a reusable function and wrapping the it with `cache()` so it can be called multiple times without incurring multiple database calls.

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

Use `getCurrentSession()` to get the current user in server components, server actions, and route handlers. Keep in mind that each server action function

```ts
// app/api/page.tsx
import { redirect } from "next/navigation";

async function Page() {
	const { user } = await getUser();
	if (user === null) {
		redirect("/login");
	}

	async function action() {
		"use server";
		const { user } = await getUser();
		if (user === null) {
			redirect("/login");
		}
		// ...
	}
	// ...
}
```
