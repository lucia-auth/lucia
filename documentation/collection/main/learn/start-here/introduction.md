---
_order: 0
title: "Introduction"
---

Lucia is a library that, at its core, makes managing users and sessions easy. It doesn't try to be something more than that and it allows you to quickly build on top of it. Here's a quick overview of what it does provide:

- A core library to manage users and validate sessions
- Database adapters that connect Lucia to your database or ORM of choice, like Prisma and Mongoose
- Integration for popular frameworks like SvelteKit and Next.js
- Packages to handle auth strategies like OAuth

> (warn) One important thing to remember is **Lucia is a server side library**. Every API provided by the core Lucia library should only be used on the server.

It's not a plug 'n play library like NextAuth, nor an auth platform like Firebase, and that is a key distinction. Lucia provides the APIs for handling authentication, but how you use them is up to you. You'll have to design the basic auth flow, and implement UI components and request handlers based on it.

Working with it looks something like this. In the code below, you're creating a new user with an email/password method, creating a new session, and creating a cookie that you set to the user.

```ts
const user = await auth.createUser({
	key: {
		providerId: "email",
		providerUserId: email,
		password
	},
	attributes: {
		email,
		username
	}
});
const session = await auth.createSession(user.userId);
const sessionCookie = auth.createSessionCookie(session);
```

Lucia aims to work well with any modern web framework and supports run-times other than Node such as Cloudflare edge workers.

> The name _Lucia_ is based on the country of Saint Lucia, so technically it's pronounced _loo-shya_. But based on a community poll, most people pronounce it _lu-si-a_. _loo-shya_, _lu-si-a_, _lu-chi-a_ your choice!

## Official packages

- Core: `lucia-auth`
- Kysely adapter: `@lucia-auth/adapter-kysely`
- Mongoose adapter: `@lucia-auth/adapter-mongoose`
- Prisma adapter: `@lucia-auth/adapter-prisma`
- Redis integration: `@lucia-auth/adapter-session-redis`
- Astro integration: `@lucia-auth/astro`
- Next.js integration: `@lucia-auth/next-js`
- OAuth integration: `@lucia-auth/oauth`
- SvelteKit integration: `@lucia-auth/sveltekit`
