---
title: "Getting started in SvelteKit"
description: "Learn how to set up Lucia in your SvelteKit project"
---

Install Lucia using your package manager of your choice.

```
npm i lucia
pnpm add lucia
yarn add lucia
```

## Initialize Lucia

Import [`lucia()`](/reference/lucia/modules/main#lucia) from `lucia` and initialize it in its own module (file). Export `auth` and its type as `Auth`. Make sure to pass the `sveltekit()` middleware. We also need to provide an `adapter` but since it'll be specific to the database you're using, we'll cover that in the next section.

```ts
// src/lib/server/lucia.ts
import { lucia } from "lucia";
import { sveltekit } from "lucia/middleware";
import { dev } from "$app/environment";

// expect error (see next section)
export const auth = lucia({
	env: dev ? "DEV" : "PROD",
	middleware: sveltekit()
});

export type Auth = typeof auth;
```

## Setup your database

Lucia uses adapters to connect to your database. We provide official adapters for a wide range of database options, but you can always [create your own](/reference/database-adapter). The schema and usage are described in each adapter's documentation. The example below is for the Prisma adapter.

```ts
// src/lib/server/lucia.ts
import { lucia } from "lucia";
import { sveltekit } from "lucia/middleware";
import { dev } from "$app/environment";
import { prisma } from "@lucia-auth/adapter-prisma";
import { PrismaClient } from "@prisma/client";

const client = new PrismaClient();

export const auth = lucia({
	env: dev ? "DEV" : "PROD",
	middleware: sveltekit(),
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

In your `src/app.d.ts` file, declare a `Lucia` namespace. The import path for `Auth` is where you initialized `lucia()`.

```ts
// src/app.d.ts
/// <reference types="lucia" />
declare global {
	namespace Lucia {
		type Auth = import("$lib/server/lucia").Auth;
		type DatabaseUserAttributes = {};
		type DatabaseSessionAttributes = {};
	}
}

// THIS IS IMPORTANT!!!
export {};
```

## Set up hooks

This is optional but highly recommended. Create a new `handle()` hook that stores [`AuthRequest`](/reference/lucia/interfaces/authrequest) to `locals.auth`.

```ts
// src/hooks.server.ts
import { auth } from "$lib/server/lucia";
import type { Handle } from "@sveltejs/kit";

export const handle: Handle = async ({ event, resolve }) => {
	// we can pass `event` because we used the SvelteKit middleware
	event.locals.auth = auth.handleRequest(event);
	return await resolve(event);
};
```

Make sure to type `Locals` as well:

```ts
// src/app.d.ts
declare global {
	namespace App {
		interface Locals {
			auth: import("lucia").AuthRequest;
		}
	}
}
```

This allows us to share and access the same `AuthRequest` instance across multiple load times, which [results in better load times when validating requests](/basics/using-cookies#caching).

## Next steps

You can learn all the concepts and general APIs of Lucia by reading the [Basics](/basics/database) section in the docs. If you prefer writing code immediately, check out the [Starter guides](/starter-guides) page or the [examples repository](https://github.com/lucia-auth/examples).

Remember to check out the [Guidebook](/guidebook) for tutorials and guides! If you have any questions, join our [Discord server](/discord)!

## Limitations

### Cloudflare

Please note that password hashing will not work on Free Bundled Workers; **the allocated 10ms CPU time is not sufficient for this**. Consider using unbound workers or paid bundled workers for hashing operations. This is not an issue when using OAuth.
