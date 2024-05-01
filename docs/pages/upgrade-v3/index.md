---
title: "Upgrade to Lucia v3"
---

# Upgrade to Lucia v3

Version 3.0 rethinks Lucia and the role it should play in your application. We have stripped out all the annoying bits, and everything else we kept has been refined even more. Everything is more flexible, and just all around easier to understand and work with.

We estimate it will take about an hour or two to upgrade your project, though it depends on how big your application is. If you're having issues with the migration or have any questions, feel free to ask on our [Discord server](https://discord.com/invite/PwrK3kpVR3).

## Major changes

The biggest change to Lucia is that keys have been removed entirely. We believe it was too limiting and ultimately an unnecessary concept that made many projects more complex than they needed to be. Another big change is that Lucia no longer handles user creation, so `createUser()` among other APIs has been removed.

For a simple password-based auth, the password can just be stored in the user table.

```ts
const passwordHash = await hash(password, {
	// recommended minimum parameters
	memoryCost: 19456,
	timeCost: 2,
	outputLen: 32,
	parallelism: 1
});
const userId = generateIdFromEntropySize(10); // 16 characters long

await db.table("user").insert({
	id: userId,
	email,
	password_hash: passwordHash
});
```

Another change is that APIs for request handling have been removed. We now just provide code snippets in the docs that you can copy-paste.

Lucia is now built with [Oslo](https://oslo.js.org), a library that provides useful auth-related utilities. While not required, we recommend installing it alongside Lucia as all guides in the documentation use it some way or another.

```
npm install lucia oslo
```

## Initialize Lucia

Here's the base config. Lucia is now initialized using the `Lucia` class, which takes an adapter and an options object. **Make sure to configure the `sessionCookie` option**.

```ts
import { Lucia, TimeSpan } from "lucia";
import { astro } from "lucia/middleware";

export const lucia = new Lucia(adapter, {
	sessionCookie: {
		attributes: {
			secure: env === "PRODUCTION" // replaces `env` config
		}
	}
});
```

Here's the fully updated configuration for reference. `middleware` and `csrfProtection` have been removed.

```ts
import { Lucia, TimeSpan } from "lucia";
import { astro } from "lucia/middleware";

export const lucia = new Lucia(adapter, {
	getSessionAttributes: (attributes) => {
		return {
			ipCountry: attributes.ip_country
		};
	},
	getUserAttributes: (attributes) => {
		return {
			username: attributes.username
		};
	},
	sessionExpiresIn: new TimeSpan(30, "d"), // no more active/idle
	sessionCookie: {
		name: "session",
		expires: false, // session cookies have very long lifespan (2 years)
		attributes: {
			secure: true,
			sameSite: "strict",
			domain: "example.com"
		}
	}
});
```

### Type declaration

Lucia v3 uses the newer module syntax instead of `.d.ts` files for declaring types for improved ergonomics and monorepo support. The `Lucia` type declaration is required.

```ts
export const lucia = new Lucia();

declare module "lucia" {
	interface Register {
		Lucia: typeof lucia;
		DatabaseSessionAttributes: DatabaseSessionAttributes;
		DatabaseUserAttributes: DatabaseUserAttributes;
	}
}

interface DatabaseSessionAttributes {
	country: string;
}
interface DatabaseUserAttributes {
	username: string;
}
```

### Polyfill

`lucia/polyfill/node` has been removed. Manually polyfill the Web Crypto API by importing the `crypto` module.

```ts
import { webcrypto } from "node:crypto";

globalThis.crypto = webcrypto as Crypto;
```

## Update your database

Refer to each database migration guide:

-   [Mongoose](/upgrade-v3/mongoose)
-   [MySQL](/upgrade-v3/mysql)
-   [PostgreSQL](/upgrade-v3/postgresql)
-   [Prisma](/upgrade-v3/prisma)
-   [SQLite](/upgrade-v3/sqlite)

The following packages are deprecated:

-   `@lucia-auth/adapter-mongoose` (see Mongoose migration guide)
-   `@lucia-auth/adapter-session-redis`
-   `@lucia-auth/adapter-session-unstorage`

If you're using a session adapter, we recommend building a custom adapter as the API has been greatly simplified.

## Sessions

### Session validation

Middleware, `Auth.handleRequest()`, and `AuthRequest` have been removed. **This means Lucia no longer provides strict CSRF protection**. For replacing `AuthRequest.validate()`, see the [Validating session cookies](/guides/validate-session-cookies) guide or a framework-specific version of it as these need to be re-implemented from scratch (though it's just copy-pasting code from the guides):

-   [Astro](/guides/validate-session-cookies/astro)
-   [Elysia](/guides/validate-session-cookies/elysia)
-   [Express](/guides/validate-session-cookies/express)
-   [Hono](/guides/validate-session-cookies/hono)
-   [Next.js App router](/guides/validate-session-cookies/nextjs-app)
-   [Next.js Pages router](/guides/validate-session-cookies/nextjs-pages)
-   [Nuxt](/guides/validate-session-cookies/nuxt)
-   [SvelteKit](/guides/validate-session-cookies/sveltekit)

`Session.sessionId` has been renamed to `Session.id`

```ts
const sessionId = session.id;
```

`validateSession()` no longer throws an error when the session is invalid, and returns an object of `User` and `Session` instead.

```ts
// v3
const { session, user } = await auth.validateSession(sessionId);
if (!session) {
	// invalid session
}
```

### Session cookies

`createSessionCookie()` now takes a session ID instead of a session object, and `createBlankSessionCookie()` should be used for creating blank session cookies.

```ts
const sessionCookie = auth.createSessionCookie(session.id);
const blankSessionCookie = auth.createBlankSessionCookie();
```

## Update authentication

Refer to these guides:

-   [Upgrade OAuth setup to v3](/upgrade-v3/oauth)
-   [Upgrade Password-based auth to v3](/upgrade-v3/password)
