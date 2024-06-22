---
title: "Getting started in SolidStart"
---

# Getting started in SolidStart

## Installation

Install Lucia using your package manager of your choice.

```
npm install lucia
```

## Initialize Lucia

Import `Lucia` and initialize it with your adapter. Refer to the [Database](/database) page to learn how to set up your database and initialize the adapter. Make sure to configure the `sessionCookie` option and register your `Lucia` instance type

```ts
// src/lib/auth.ts
import { Lucia } from "lucia";

const adapter = new BetterSQLite3Adapter(db); // your adapter

export const lucia = new Lucia(adapter, {
	sessionCookie: {
		attributes: {
			// set to `true` when using HTTPS
			secure: import.meta.env.PROD
		}
	}
});

declare module "lucia" {
	interface Register {
		Lucia: typeof lucia;
	}
}
```

## Set up middleware

We recommend setting up a middleware to validate requests. The validated user will be available as `context.user`. You can just copy-paste the code into `src/middleware.ts`.

It's a bit verbose, but it just reads the session cookie, validates it, and sets a new cookie if necessary. Since SolidStart doesn't implement CSRF protection out of the box, it must be implemented when working with cookies. If you're curious about what's happening here, see the [Validating requests](/guides/validate-session-cookies/solidstart) page.

```ts
// src/middleware.ts
import { createMiddleware, appendHeader, getCookie, getHeader } from "@solidjs/start/server";
import { Session, User, verifyRequestOrigin } from "lucia";
import { lucia } from "./lib/auth";

export default createMiddleware({
	onRequest: async (event) => {
		if (event.node.req.method !== "GET") {
			const originHeader = getHeader(event, "Origin") ?? null;
			const hostHeader = getHeader(event, "Host") ?? null;
			if (!originHeader || !hostHeader || !verifyRequestOrigin(originHeader, [hostHeader])) {
				event.node.res.writeHead(403).end();
				return;
			}
		}

		const sessionId = getCookie(event, lucia.sessionCookieName) ?? null;
		if (!sessionId) {
			event.context.session = null;
			event.context.user = null;
			return;
		}

		const { session, user } = await lucia.validateSession(sessionId);
		if (session && session.fresh) {
			appendHeader(event, "Set-Cookie", lucia.createSessionCookie(session.id).serialize());
		}
		if (!session) {
			appendHeader(event, "Set-Cookie", lucia.createBlankSessionCookie().serialize());
		}
		event.context.session = session;
		event.context.user = user;
	}
});

declare module "vinxi/server" {
	interface H3EventContext {
		user: User | null;
		session: Session | null;
	}
}
```

Make sure to declare the middleware module in the config.

```ts
// vite.config.ts
import { defineConfig } from "@solidjs/start/config";

export default defineConfig({
	start: {
		middleware: "./src/middleware.ts"
	}
});
```

## Next steps

You can learn all the concepts and APIs by reading the [Basics section](/basics/sessions) in the docs. If you prefer writing code immediately, check out the [Tutorials](/tutorials) page or the [examples repository](https://github.com/lucia-auth/examples/tree/main).

This documentation often references [the Copenhagen Book](https://thecopenhagenbook.com). This is an open-source guide on implementing auth and should come in handy when implementing anything auth, including passkeys, multi-factor authentication, and a bit of cryptography. We recommend reading it to learn more about auth in web applications.

If you have any questions, [join our Discord server](https://discord.com/invite/PwrK3kpVR3)!
