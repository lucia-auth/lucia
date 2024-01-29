---
title: "Getting started in Next.js App router"
---

# Getting started in Next.js App router

## Installation

Install Lucia using your package manager of your choice. While not strictly necessary, we recommend installing [Oslo](https://oslo.js.org), which Lucia is built on, for various auth utilities (which a lot of the guides in the docs use).

```
npm install lucia oslo
```

**`oslo/password` does NOT work with Turbopack.**

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

## Update configuration

If you've installed Oslo, mark its dependencies as external to prevent it from getting bundled. This is only required when using the `oslo/password` module.

```ts
// next.config.ts
const nextConfig = {
	webpack: (config) => {
		config.externals.push("@node-rs/argon2", "@node-rs/bcrypt");
		return config;
	}
};
```

## Next steps

You can learn all the concepts and APIs by reading the [Basics section](/basics/sessions) in the docs. If you prefer writing code immediately, check out the [Tutorials](/tutorials) page or the [examples repository](https://github.com/lucia-auth/examples/tree/main).

If you have any questions, [join our Discord server](https://discord.com/invite/PwrK3kpVR3)!
