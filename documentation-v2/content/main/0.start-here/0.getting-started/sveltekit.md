---
order: 0
title: "Getting started in SvelteKit"
menuTitle: "SvelteKit"
description: "Learn how to set up Lucia in your SvelteKit project"
---

Install Lucia using your package manager of your choice.

```
npm i lucia
pnpm add lucia
yarn add lucia
```

## Initialize Lucia

Import [`lucia()`](/reference/lucia/main#lucia) from `lucia` and initialize it in its own module (file). Export `auth` and its type as `Auth`. Make sure to pass the `sveltekit()` middleware. We also need to provide an `adapter` but since it'll be specific to the database you're using, we'll cover that in the next section.

```ts
// src/lib/server/lucia.ts
import { lucia } from "lucia";
import { sveltekit } from "lucia/middleware";
import { dev } from "$app/environment";

// expect error
export const auth = lucia({
	env: dev ? "DEV" : "PROD",
	middleware: sveltekit()
});

export type Auth = typeof auth;
```

## Setup your database

Lucia uses adapters to connect to your database. We provide official adapters for a wide range of database options, but you can always [create your own](/extending-lucia/database-adapters-api). The schema and usage are described in each adapter's documentation. The example below is for the Prisma adapter.

```ts
// src/lib/server/lucia.ts
import { lucia } from "lucia";
import { sveltekit } from "lucia/middleware";
import { dev } from "$app/environment";
import { prisma } from "@lucia-auth/adapter-prisma";
import { PrismaClient } from "@prisma/client";

const client = new PrismaClient();

const auth = lucia({
	env: dev ? "DEV" : "PROD",
	middleware: sveltekit(),
	adapter: prisma(client)
});
```

### Adapters for database drivers and ORMs

- [`better-sqlite3`](/database-adapters/better-sqlite3): SQLite
- [libSQL](/database-adapters/libSQL): libSQL (Turso)
- [Mongoose](/database-adapters/mongoose): MongoDB
- [`mysql2`](/database-adapters/mysql2): MySQL
- [`pg`](/database-adapters/pg): PostgreSQL
- [Prisma](/database-adapters/prisma): MongoDB, MySQL, PostgreSQL, SQLite
- [Redis](/database-adapters/redis): Redis

### Provider specific adapters

- [Cloudflare D1](/database-adapters/cloudflare-d1)
- [PlanetScale serverless](/database-adapters/planetscale-serverless)

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

This is optional but highly recommended. Create a new `handle()` hook that stores [`Auth`](/reference/lucia/interfaces/authrequest) to `locals.auth`.

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

This allows us to validate sessions inside server load functions and endpoints using a single line of code.

```ts
// +page.server.ts
export const load = async ({ locals }) => {
	const session = await locals.auth.validate();
};
```
