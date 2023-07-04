---
title: "Using the App router"
_order: 0
---

While Lucia "works" with the new App router in Next.js v13, **your users will be signed out after 24 hours** with the default configuration. Currently, you cannot set cookies/headers inside `page.tsx`, and as such, Lucia cannot store renewed sessions when a user revisits your site. This can somewhat addressed by extending the session expiration with the [`sessionExpiresIn.activePeriod`](/basics/configuration#sessionexpiresin) configuration.

There are no differences in Lucia's API between Node.js and the edge runtime when using the App router.

### Extending session expiration

```ts
// auth/lucia.ts
export const auth = lucia({
	// ...
	sessionExpiresIn: {
		activePeriod: 1000 * 60 * 60 * 24 * 30, // 1 month
		idlePeriod: 0 // disable session renewal
	}
});
```

## Pages

```ts
// app/page.tsx
import { auth } from "@/auth/lucia";
import { cookies } from "next/headers";

export default () => {
	const authRequest = auth.handleRequest({
		cookies
	});
	const { user } = await authRequest.validateUser();
	// ...
};
```

## Route handlers

```ts
// app/routes.ts
import { auth } from "@/auth/lucia";

export const GET = async (request: Request) => {
	const authRequest = auth.handleRequest({
		request,
		cookies
	});
	const { user } = await authRequest.validateUser();
	// ...
};
```

## Server actions

Server actions are an alpha feature in Next.js that handles form actions. Lucia's CSRF protection does not work with it currently and it **must** be disabled (refer to the [`csrfProtection`](http://localhost:3000/basics/configuration#csrfprotection) configuration).

```ts
// app/page.tsx
import { auth } from "@/auth/lucia";
import { cookies } from "next/headers";

export default async () => {
	const action = async () => {
		"use server";
		// make sure you don't re-use the authRequest initialized outside the server action
		const authRequest = auth.handleRequest({
			cookies
		});
		// ...
	};
	// ...
};
```

> (red) Make sure you implement your own CSRF protection (such as the double-submit cookie method) when you disable the built-in CSRF protection.
