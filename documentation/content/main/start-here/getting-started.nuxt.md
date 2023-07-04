---
_order: 1
title: "Getting started"
description: "Learn how to get started with Lucia using Nuxt"
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

In `server/utils/auth.ts`, import [`lucia`](/reference/lucia-auth/auth) from `lucia-auth`. Initialize it by defining `adapter` and `env` and export it. Additionally, we will import the H3 middleware and pass it on to `middleware`. Make sure to export `typeof auth` as well.

```ts
// server/utils/auth.ts
import lucia from "lucia-auth";
import { h3 } from "lucia-auth/middleware";
import prisma from "@lucia-auth/adapter-prisma";
import { PrismaClient } from "@prisma/client";
import { dev } from "$app/environment";

export const auth = lucia({
	adapter: prisma(new PrismaClient()),
	env: process.dev ? "DEV" : "PROD",
	middleware: h3()
});

export type Auth = typeof auth;
```

### Types

Create `server/lucia.d.ts`, and inside it configure your types. The path in `import('./auth/lucia.js').Auth;` is where you exported `auth` (`lucia()`).

```ts
// server/lucia.d.ts
/// <reference types="lucia-auth" />
declare namespace Lucia {
	type Auth = import("./utils/auth.js").Auth;
	type UserAttributes = {
		username: string;
	};
}
```

## Polyfill `crypto` global

**This is only required for Node.js v18 and below.** Import `lucia-auth/polyfill/node` in `auth.ts`.

```ts
// server/utils/auth.ts
import lucia from "lucia-auth";
import "lucia-auth/polyfill/node";

// ...

export const auth = lucia({
	// ...
});

export type Auth = typeof auth;
```

This is a side-effect import which is excluded by Nuxt by default. Update your config to escape from the default behavior:

```ts
// nuxt.config.ts
export default defineNuxtConfig({
	// ...
	nitro: {
		moduleSideEffects: ["lucia-auth/polyfill/node"]
	}
});
```

Alternatively, add the `--experimental-global-webcrypto` flag to the `dev` and `build` scripts:

```json
{
	// ...
	"scripts": {
		"build": "NODE_OPTIONS=--experimental-global-webcrypto nuxt build",
		"dev": "NODE_OPTIONS=--experimental-global-webcrypto nuxt dev",
		"generate": "NODE_OPTIONS=--experimental-global-webcrypto nuxt generate",
		"preview": "NODE_OPTIONS=--experimental-global-webcrypto nuxt preview",
		"postinstall": "NODE_OPTIONS=--experimental-global-webcrypto nuxt prepare"
	}
	// ...
}
```

If you're using Node v14, you'll need to use a third party polyfill and set it as a global variable:

```ts
globalThis.crypto = webCryptoPolyfill;
```
