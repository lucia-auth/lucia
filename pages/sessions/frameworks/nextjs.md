---
title: "Next.js implementation notes"
---

# Next.js implementation notes

## Validating sessions

We recommend creating a reusable `getCurrentSession()` function that wraps the validation logic with `cache()` so it can be called multiple times without causing multiple database calls.

```ts
import { cookies } from "next/headers";
import { cache } from "react";

export const getCurrentSession = cache(async (): Promise<Session> => {
	const cookieStore = await cookies();
	const token = cookieStore.get("session")?.value ?? null;
	if (token === null) {
		return { session: null, user: null };
	}
	const result = await validateSessionToken(token);
	return result;
});
```

## Persisting cookies

You cannot set cookies with `cookies()` or `headers()` when rendering routes. This will throw an error:

```tsx
import { cookies } from "next/headers";

export default function Page() {
	const cookieStore = await cookies();
	cookieStore.set("message", "hello");
	// ...
}
```

This becomes an issue if you want to persist session cookies by continuously setting a new cookie. We recommend using Next.js middleware for this instead.

```ts
export function middleware(request: NextRequest) {
	const response = NextResponse.next();

	const sessionToken = request.cookies.get("session")?.value ?? null;

	if (sessionToken !== null) {
		// Re-set the cookie with updated expiration
		response.cookies.set({
			name: "session",
			value: sessionToken,
			maxAge: 60 * 60 * 24 * 365, // 1 year
			path: "/",
			httpOnly: true,
			secure: process.env.NODE_ENV === "production"
		});
	}

	return response;
}
```
