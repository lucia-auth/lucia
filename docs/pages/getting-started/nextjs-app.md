---
title: "Getting started in Next.js App router"
---

# Getting started in Next.js App router

## Installation

Install Lucia using your package manager of your choice.

```
npm install lucia
```

## Initialize Lucia

Import `Lucia` and initialize it with your adapter. Refer to the [Database](/database) page to learn how to set up your database and initialize the adapter. Make sure you configure the `sessionCookie` option and register your `Lucia` instance type.

```ts
// src/auth.ts
import { Lucia } from "lucia";

const adapter = new BetterSQLite3Adapter(db); // your adapter

export const lucia = new Lucia(adapter, {
	sessionCookie: {
		// this sets cookies with super long expiration
		// since Next.js doesn't allow Lucia to extend cookie expiration when rendering pages
		expires: false,
		attributes: {
			// set to `true` when using HTTPS
			secure: process.env.NODE_ENV === "production"
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

If you're using Node.js 18 or below, you'll need to polyfill the Web Crypto API. This is not required in Node.js 20, CloudFlare Workers, Deno, Bun, and Vercel Edge Functions. This can be done either by importing `webcrypto`, or by enabling an experimental flag.

```ts
import { webcrypto } from "node:crypto";

globalThis.crypto = webcrypto as Crypto;
```

```
node --experimental-web-crypto index.js
```

## Next steps

You can learn all the concepts and APIs by reading the [Basics section](/basics/sessions) in the docs. If you prefer writing code immediately, check out the [Tutorials](/tutorials) page or the [examples repository](https://github.com/lucia-auth/examples/tree/main).

This documentation often references [the Copenhagen Book](https://thecopenhagenbook.com). This is an open-source guide on implementing auth and should come in handy when implementing anything auth, including passkeys, multi-factor authentication, and a bit of cryptography. We recommend reading it to learn more about auth in web applications.

If you have any questions, [join our Discord server](https://discord.com/invite/PwrK3kpVR3)!
