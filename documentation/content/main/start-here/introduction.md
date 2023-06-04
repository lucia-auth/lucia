---
_order: 0
title: "Introduction"
description: "A quick introduction on Lucia"
---

Lucia is a library that, at its core, makes managing users and sessions easy. It doesn't try to be something more than that and it allows you to quickly build on top of it. Here's a quick overview of what it does provide:

- A core library to manage users and validate sessions
- Database adapters that connect Lucia to your database or ORM of choice, like Prisma and Mongoose
- Support for popular frameworks like SvelteKit, Next.js, Express, and Astro
- Packages to handle auth strategies like OAuth

> (warn) One important thing to remember is **Lucia is a server side library**. Every API provided by the core Lucia library should only be used on the server.

It's not a plug 'n play library like NextAuth, nor an auth platform like Firebase, and that is a key distinction. Lucia provides the APIs for handling authentication, but how you use them is up to you. You'll have to design the basic auth flow, and implement UI components and request handlers based on it.

Working with it looks something like this. In the code below, you're creating a new user with an email/password method, creating a new session, and creating a cookie that you set to the user.

```ts
const user = await auth.createUser({
	primaryKey: {
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

If you have any questions, feel free to ask in our [Discord server](https://discord.gg/PwrK3kpVR3)!

> The name _Lucia_ is based on the country of Saint Lucia, so technically it's pronounced _loo-shya_. But based on a community poll, most people pronounce it _lu-si-a_. _loo-shya_, _lu-si-a_, _lu-chi-a_ your choice!

## Runtime support

While Lucia does not rely on any native Node.js module, it does require the global [`Crypto` web API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Crypto_API). It can be used without any configuration in the following runtimes:

- Node.js v19 or later (see below)
- Deno v1.18 or later
- Cloudflare Workers (including Vercel Edge functions)
- Bun v0.2.2 or later

### Node.js

Lucia can be used with Node v16 or later when `crypto` global is polyfilled. This is already handled by the following frameworks:

- SvelteKit

If you're not using one of the listed frameworks above, you can use the polyfill provided by Lucia or by enabling a Node flag. Node v14 can be used as well, though a third party polyfill must be used instead.

## Framework support

Similar to adapters that allow Lucia to be used with any database, Lucia also provide "middleware". These transform framework specific server events (like a request object) to something Lucia can use. This is for cookie read/write and CSRF protection.

We currently support the following frameworks:

- Astro 2
- Express
- Next.js 12/13
- Nuxt 3
- Remix
- SvelteKit
- Qwik City

Lucia is a sever-side library, so it does not provide any client side helpers.

## Official packages

- Core: `lucia-auth`
- Mongoose adapter: `@lucia-auth/adapter-mongoose`
- MySQL adapters: `@lucia-auth/adapter-mysql`
- PostgreSQL adapters: `@lucia-auth/adapter-postgresql`
- Prisma adapter: `@lucia-auth/adapter-prisma`
- Redis adapter: `@lucia-auth/adapter-session-redis`
- SQLite adapters: `@lucia-auth/adapter-sqlite`
- OAuth integration: `@lucia-auth/oauth`
- Tokens integration: `@lucia-auth/tokens`
