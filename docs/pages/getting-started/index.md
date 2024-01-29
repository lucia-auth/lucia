---
title: "Getting started"
---

# Getting started

A framework-specific guide is also available for:

- [Astro](/getting-started/astro)
- [Express](/getting-started/express)
- [Next.js App router](/getting-started/nextjs-app)
- [Next.js Pages router](/getting-started/nextjs-pages)
- [Nuxt](/getting-started/nuxt)
- [SolidStart](/getting-started/solidstart)
- [SvelteKit](/getting-started/sveltekit)

## Installation

Install Lucia using your package manager of your choice. While not strictly necessary, we recommend installing [Oslo](https://oslo.js.org), which Lucia is built on, for various auth utilities (which a lot of the guides use).

```
npm install lucia oslo
```

## Initialize Lucia

Import `Lucia` and initialize it with your adapter. Refer to the [Database](/database) page to learn how to set up your database and initialize the adapter. Make sure you configure the `sessionCookie` option and register your `Lucia` instance type.

```ts
import { Lucia } from "lucia";

const adapter = new BetterSQLite3Adapter(db); // your adapter

export const lucia = new Lucia(adapter, {
	sessionCookie: {
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

## Update bundler configuration

This is only required if you're using `oslo/password`.

### Vite

This is not required if you're Nuxt, SolidStart, or SvelteKit.

```ts
import { defineConfig } from "vite";

export default defineConfig({
	// ...
	optimizeDeps: {
		exclude: ["oslo"]
	}
});
```

### Webpack

```ts
module.exports = {
	// ...
	externals: ["@node-rs/argon2", "@node-rs/bcrypt"]
};
```
