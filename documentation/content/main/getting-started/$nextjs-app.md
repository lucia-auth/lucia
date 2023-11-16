---
title: "Getting started in Next.js App Router"
description: "Learn how to set up Lucia in your Next.js App Router project"
---

Install Lucia using your package manager of your choice.

```
npm i lucia
pnpm add lucia
yarn add lucia
```

## Initialize Lucia

Import [`lucia()`](/reference/lucia/modules/main#lucia) from `lucia` and initialize it in its own module (file). Export `auth` and its type as `Auth`. **Make sure to pass the `nextjs_future()` middleware, and NOT `nextjs()` (will be removed in the future)**. We also need to provide an `adapter` but since it'll be specific to the database you're using, we'll cover that in the next section.

Make sure to set [`sessionCookie.expires`](/basics/configuration#sessioncookie) to `false`.

```ts
// auth/lucia.ts
import { lucia } from "lucia";
import { nextjs_future } from "lucia/middleware";

// expect error (see next section)
export const auth = lucia({
	env: "DEV", // "PROD" if deployed to HTTPS
	middleware: nextjs_future(), // NOT nextjs()
	sessionCookie: {
		expires: false
	}
});

export type Auth = typeof auth;
```

## Setup your database

Lucia uses adapters to connect to your database. We provide official adapters for a wide range of database options, but you can always [create your own](/reference/database-adapter). The schema and usage are described in each adapter's documentation. The example below is for the Prisma adapter.

```ts
// auth/lucia.ts
import { lucia } from "lucia";
import { nextjs_future } from "lucia/middleware";
import { prisma } from "@lucia-auth/adapter-prisma";
import { PrismaClient } from "@prisma/client";

const client = new PrismaClient();

const auth = lucia({
	env: "DEV", // "PROD" if deployed to HTTPS
	middleware: nextjs_future(),
	sessionCookie: {
		expires: false
	},

	adapter: prisma(client)
});
```

### Adapters for database drivers and ORMs

- [`better-sqlite3`](/database-adapters/better-sqlite3): SQLite
- [libSQL](/database-adapters/libsql): libSQL (Turso)
- [Mongoose](/database-adapters/mongoose): MongoDB
- [`mysql2`](/database-adapters/mysql2): MySQL
- [`pg`](/database-adapters/pg): PostgreSQL (including `@neondatabase/serverless`, `@vercel/postgres`)
- [`postgres`](/database-adapters/postgres): PostgreSQL
- [Prisma](/database-adapters/prisma): MongoDB, MySQL, PostgreSQL, SQLite
- [Redis](/database-adapters/redis): Redis
- [Unstorage](/database-adapters/unstorage): Azure, Cloudflare KV, Memory, MongoDB, Planetscale, Redis, Vercel KV

### Provider specific adapters

- [Cloudflare D1](/database-adapters/cloudflare-d1)
- [PlanetScale serverless](/database-adapters/planetscale-serverless)
- [Upstash Redis](/database-adapters/upstash-redis)

### Using query builders

- [Drizzle ORM](/guidebook/drizzle-orm)
- [Kysely](/guidebook/kysely)

## Set up types

Create a TS declaration file (`app.d.ts`) in your project root and declare a `Lucia` namespace. The import path for `Auth` is where you initialized `lucia()`.

```ts
// app.d.ts
/// <reference types="lucia" />
declare namespace Lucia {
	type Auth = import("./auth/lucia").Auth;
	type DatabaseUserAttributes = {};
	type DatabaseSessionAttributes = {};
}
```

## Polyfill

If you're using Node.js version 18 or below, you need to polyfill the [Web Crypto API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Crypto_API). This is not required if you're using runtimes other than Node.js (Deno, Bun, Cloudflare Workers, etc) or using Node.js v20 and above.

```ts
// auth/lucia.ts
import { lucia } from "lucia";
import "lucia/polyfill/node";

export const auth = lucia({
	// ...
});
```

Optionally, instead of doing a side-effect import, add the `--experimental-global-webcrypto` flag when running `next`.

```json
// package.json
{
	// ...
	"scripts": {
		"dev": "NODE_OPTIONS=--experimental-global-webcrypto next dev",
		"start": "NODE_OPTIONS=--experimental-global-webcrypto next start"
		// ...
	}
	// ...
}
```

## Next steps

You can learn all the concepts and general APIs of Lucia by reading the [Basics](/basics/database) section in the docs. If you prefer writing code immediately, check out the [Starter guides](/starter-guides) page or the [examples repository](https://github.com/lucia-auth/examples).

Remember to check out the [Guidebook](/guidebook) for tutorials and guides! If you have any questions, join our [Discord server](/discord)!
