---
layout: "@layouts/DocLayout.astro"
title: "Upgrade to Lucia v3"
---

Version 3.0 rethinks Lucia and the role it should play into your application. We have stripped out all the annoying bits, and everything else we kept has been refined even more. Everything is more flexible, and just all around easier to understand and work with. 

We estimate it shouldn't take longer than an hour to upgrade your project. If you're having issues with the migration or have any questions, feel free to ask on our [Discord server](https://discord.com/invite/PwrK3kpVR3). Click [here for the full changelog]().

## Major changes

The biggest change to Lucia is that keys have been removed entirely. We believe it was too limiting and ultimately an unnecessary concept that made many projects more complex than it needed to be. Another big change is that Lucia no longer handles user creation, so `createUser()` among other APIs have been removed.

For a simple password based auth, the password can just be stored in the user table.

```ts
const hashedPassword = await new Argon2id().hash(password);
const userId = generateId(15);

await db.table("user").insert({
	id: userId,
	email,
	hashed_password: hashedPassword
});
```

Lucia is also now built with [Oslo]() which provides useful auth-related utilities. While not required, we recommend installing it alongside Lucia as all guides in the documentation use it some way or another.

```
npm install lucia@latest oslo@latest
```

## Initialize Lucia

Here's the base config. Lucia is now initialized using the `Lucia` class, which takes an adapter and an options object. **Make sure to set the `sessionCookie` config**.

```ts
import { Lucia, TimeSpan } from "lucia";
import { astro } from "lucia/middleware";

export const auth = new Lucia(adapter, {
	sessionCookie: {
		attributes: {
			secure: env === "PRODUCTION" // replaces `env` config
		}
	}
});
```

Here's the full updated configuration.

```ts
import { Lucia, TimeSpan } from "lucia";
import { astro } from "lucia/middleware";

export const auth = new Lucia(adapter, {
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
	middleware: astro(),
	csrfProtection: {
		host,
		hostHeader,
		allowedDomains: ["admin.example.com"] // replaced `allowedSubdomains`
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

Lucia v3 uses the newer module syntax instead of `.d.ts` files for declaring types for improved agronomics and monorepo support. The `Lucia` type declaration is required.

```ts
export const auth = new Lucia();

declare module "lucia" {
	interface Register {
		Lucia: typeof auth;
		DatabaseUserAttributes: {
			username: string;
		};
		DatabaseSessionAttributes: {
			ip_country: string;
		};
	}
}
```

## Update your database

Refer to each database migration guide:

- [Mongoose]()
- [MySQL]()
- [PostgreSQL]()
- [Prisma]()
- [SQLite]()

The following packages are deprecated:

- `@lucia-auth/adapter-mongoose` (see Mongoose migration guide)
- `@lucia-auth/adapter-session-redis`
- `@lucia-auth/adapter-session-unstorage`

## Session validation

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

Similar changes have been made to `AuthRequest.validate()`:

```ts
// v3
const { session, user } = await authRequest.validate(sessionId);
```

## Session cookies

`createSessionCookie()` now takes a session ID instead of a session object, and `createBlankSessionCookie()` should be used for creating blank session cookies.

```ts
const sessionCookie = auth.createSessionCookie(session.id);
const blankSessionCookie = auth.createBlankSessionCookie(session.id);
```

`AuthRequest.setSession()` has been replaced by `AuthRequest.setSessionCookie()` (which takes a session ID), and you must use `AuthRequest.deleteSessionCookie()` to a delete session cookie.

```ts
authRequest.setSessionCookie(session.id);
authRequest.deleteSessionCookie();
```

## Update authentication

Refer to these guides:

- [Upgrade OAuth setup to v3]()
- [Upgrade Password-based auth to v3]()

## Framework specific changes

- `nextjs_future()` middleware is now just `nextjs()`
- Next.js middleware no longer accepts just a request object (cannot be used in Next.js middleware or Pages router edge API route)
- Removed `web()` middleware
