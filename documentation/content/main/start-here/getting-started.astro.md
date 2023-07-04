---
_order: 1
title: "Getting started"
description: "Learn how to get started with Lucia using Astro"
---

Install Lucia using your package manager of your choice.

```
npm i lucia-auth
pnpm add lucia-auth
yarn add lucia-auth
```

## Set up the database

To support multiple databases, Lucia uses database adapters. These adapters provide a set of standardized methods to read from and update the database. Custom adapters can be created as well if Lucia does not provide one.

We currently support the following database/ORM options:

- [Drizzle ORM](/adapters/drizzle)
- [Kysely](/adapters/kysely)
- [Mongoose](/adapters/mongoose)
- [MySQL](/adapters/mysql)
- [PlanetScale serverless](/adapters/planetscale)
- [PostgreSQL](/adapters/postgresql)
- [Prisma](/adapters/prisma)
- [Redis](/adapters/redis)
- [SQLite](/adapters/sqlite)

## Initialize Lucia

In `src/lib/lucia.ts`, import [`lucia`](/reference/lucia-auth/auth) from `lucia-auth`. Initialize it by defining `adapter` and `env` and export it. Additionally, we will import the Astro middleware and pass it on to `middleware`. Make sure to export `typeof auth` as well.

```ts
// src/lib/lucia.ts
import lucia from "lucia-auth";
import prisma from "@lucia-auth/adapter-prisma";
import { PrismaClient } from "@prisma/client";
import { astro } from "lucia-auth/middleware";

export const auth = lucia({
	adapter: prisma(new PrismaClient()),
	env: import.meta.env.DEV ? "DEV" : "PROD",
	middleware: astro()
});

export type Auth = typeof auth;
```

This module and the file that holds it **should NOT be imported from the client**.

## Configure your Astro project

Astro specific functions are imported from `@lucia-auth/astro`.

### Enable SSR

Enable Server-side rendering by setting `output` to `"server"` inside `astro.config.mjs`.

```diff
export default defineConfig({
  integrations: [],
+  output: "server"
});
```

### Types

Create `src/lucia.d.ts`, and inside it configure your types. The path in `import('./lib/lucia.js').Auth;` is where you exported `auth` (`lucia()`).

```ts
// src/lucia.d.ts
/// <reference types="lucia-auth" />
declare namespace Lucia {
	type Auth = import("./lib/lucia.js").Auth;
	type UserAttributes = {};
}
```

## Polyfill `crypto` global

**This is only required for Node.js v18 and below.** Import `lucia-auth/polyfill/node` in `lucia.ts`.

```ts
// auth/lucia.ts
import lucia from "lucia-auth";
import "lucia-auth/polyfill/node";

// ...

export const auth = lucia({
	// ...
});

export type Auth = typeof auth;
```

Alternatively, add the `--experimental-global-webcrypto` flag to all `astro` scripts:

```json
{
	// ...
	"scripts": {
		"dev": "NODE_OPTIONS=--experimental-global-webcrypto astro dev",
		"start": "NODE_OPTIONS=--experimental-global-webcrypto astro dev",
		"build": "NODE_OPTIONS=--experimental-global-webcrypto astro build",
		"preview": "NODE_OPTIONS=--experimental-global-webcrypto astro preview",
		"astro": "astro"
	}
	// ...
}
```

If you're using Node v14, you'll need to use a third party polyfill and set it as a global variable:

```ts
// can't override globalThis.crypto entirely
// as Astro patches globalThis.crypto.getRandomValues() (but only that method)
// and globalThis.crypto is set to writable=false
globalThis.crypto.randomUUID = webCryptoPolyfill.randomUUID;
globalThis.crypto.subtle = webCryptoPolyfill.subtle;
```
