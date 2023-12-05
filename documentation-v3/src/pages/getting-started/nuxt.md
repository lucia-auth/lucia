---
layout: "@layouts/DocLayout.astro"
title: "Getting started in Nuxt"
---

Install Lucia using your package manager of your choice. While not strictly necessary, we recommend installing [Oslo](https://oslo.js.org), which Lucia is built on, for various auth utilities (which a lot of the guides use).

```
npm install lucia@beta oslo
```

## Initialize Lucia

Import `Lucia` and initialize it with your adapter. Refer to the [Database](/database) page to learn how to setup your database and initialize the adapter. Make sure you:

- Use the `nuxt` middleware
- Configure the `sessionCookie` option
- Register your `Lucia` instance type

```ts
// server/utils/auth.ts
import { Lucia } from "lucia";
import { nuxt } from "lucia/middleware";

const adapter = new BetterSQLite3Adapter(db); // your adapter

export const lucia = new Lucia(adapter, {
	middleware: nuxt(),
	sessionCookie: {
		// IMPORTANT!
		attributes: {
			// set to `true` when using HTTPS
			secure: !process.dev
		}
	}
});

// IMPORTANT!
declare module "lucia" {
	interface Register {
		Lucia: typeof lucia;
	}
}
```

## Polyfill

If you're using Node.js 18 or below, you'll need to polyfill the Web Crypto API. This is not required in Node.js 20, CouldFlare Workers, Deno, Bun, and Vercel Edge Functions. This can be done either by importing `webcrypto`, or by enabling an experimental flag.

```ts
import { webcrypto } from "node:crypto";

globalThis.crypto = webcrypto as Crypto;
```

```
node --experimental-web-crypto index.js
```

## Setup middleware

We recommend setting up a middleware to validate requests. The validated user will be available as `event.context.user`. You can just copy-paste the code into `server/middleware/auth.ts`.

It's a bit verbose, but it just reads the session cookie, validates it, and sets a new cookie if necessary. Since Nuxt doesn't implement CSRF protection out of the box, it must be implemented. If you're curious about what's happening here, see the [Validating requests](/basics/validate-session-cookies/nuxt) page.

```ts
// server/middleware/auth.ts
import { verifyRequestOrigin } from "oslo/request";

import type { H3Event } from "h3";
import type { User } from "lucia";

export default defineEventHandler((event) => {
	// CSRF protection
	// this is VERY important
	// you may want to skip the check for HEAD and OPTIONS requests too
	if (context.request.method !== "GET") {
		const originHeader = getHeader(event, "Origin") ?? null;
		const hostHeader = getHeader(event, "Host") ?? null;
		if (!originHeader || !hostHeader) {
			return event.node.res.writeHead(403).end();
		}
		const validRequestOrigin = verifyRequestOrigin(originHeader, [hostHeader]);
		if (!validRequestOrigin) {
			return event.node.res.writeHead(403).end();
		}
	}

	const sessionId = getCookie(event, lucia.sessionCookieName) ?? null;
	if (!sessionId) {
		event.context.user = null;
		return;
	}
	
	const { session, user } = await lucia.validateSession(sessionId);
	if (session && session.fresh) {
		// update session expiration
		const sessionCookie = lucia.createSessionCookie(session.id);
		setCookie(event, sessionCookie.name, sessionCookie.value, sessionCookie.attributes);
	}
	if (!session) {
		// delete session cookie if invalid
		const sessionCookie = lucia.createBlankSessionCookie();
		setCookie(event, sessionCookie.name, sessionCookie.value, sessionCookie.attributes);
	}
	event.context.user = user;
});

declare module "h3" {
	interface H3EventContext {
		user: User | null;
	}
}
```

## Next steps

You can learn all the concepts and APIs by reading the [Basics section](/basics/sessions) in the docs. If you prefer writing code immediately, check out the [Tutorials](/tutorials) page or the [examples repository](/https://github.com/lucia-auth/examples).

If you have any questions, [join our Discord server](https://discord.com/invite/PwrK3kpVR3)!
