---
order: 0
title: "Getting started in Remix"
menuTitle: "Remix"
description: "Learn how to set up Lucia in your Remix project"
---

Install Lucia using your package manager of your choice.

```
npm i lucia
pnpm add lucia
yarn add lucia
```

## Configure Remix project

Lucia is an ESM package and you must define all modules in `serverDependenciesToBundle`:

```ts
// remix.config.js

/** @type {import('@remix-run/dev').AppConfig} */
module.exports = {
	// ...
	serverDependenciesToBundle: [
		"lucia",
		"lucia/middleware",
		"lucia/polyfill/node",
		"@lucia-auth/adapter-prisma" // adapter you're using
	]
};
```

Make sure to add your adapter package as well.

## Initialize Lucia

Import [`lucia()`](/reference/lucia/main#lucia) from `lucia` and initialize it in its own api module (file). Export `auth` and its type as `Auth`. Make sure to pass the `web()` middleware. We also need to provide an `adapter` but since it'll be specific to the database you're using, we'll cover that in the next section.

```ts
// auth/lucia.server.ts
import { lucia } from "lucia";
import { web } from "lucia-auth/middleware";

// expect error
export const auth = lucia({
	env: process.dev ? "DEV" : "PROD",
	middleware: web()
});

export type Auth = typeof auth;
```

## Setup your database

Lucia uses adapters to connect to your database. We provide official adapters for a wide range of database options, but you can always [create your own](/extending-lucia/database-adapters-api). The schema and usage are described in each adapter's documentation. The example below is for the Prisma adapter.

```ts
// auth/lucia.server.ts
import { lucia } from "lucia";
import { web } from "lucia/middleware";
import { prisma } from "@lucia-auth/adapter-prisma";
import { PrismaClient } from "@prisma/client";

const client = new PrismaClient();

const auth = lucia({
	env: "DEV", // "PROD" if deployed to HTTPS
	middleware: web(),
	adapter: prisma(client)
});
```

### Adapters for database drivers and ORMs

- [`better-sqlite3`](/database-adapters/better-sqlite3): SQLite
- [libSQL](/database-adapters/libSQL): libSQL (Turso)
- [Mongoose](/database-adapters/mongoose): MongoDB
- [`mysql2`](/database-adapters/mysql2): MySQL
- [`pg`](/database-adapters/pg): PostgreSQL
- [`postgres`](https://github.com/porsager/postgres): PostgreSQL
- [Prisma](/database-adapters/prisma): MongoDB, MySQL, PostgreSQL, SQLite
- [Redis](/database-adapters/redis): Redis

### Provider specific adapters

- [Cloudflare D1](/database-adapters/cloudflare-d1)
- [PlanetScale serverless](/database-adapters/planetscale-serverless)

## Set up types

Create a TS declaration file (`app.d.ts`) and declare a `Lucia` namespace. The import path for `Auth` is where you initialized `lucia()`.

```ts
// app.d.ts
/// <reference types="lucia" />
declare namespace Lucia {
	type Auth = import("./auth/lucia.server.js").Auth;
	type DatabaseUserAttributes = {};
	type DatabaseSessionAttributes = {};
}
```

## Polyfill

If you're using Node.js version 18 or below, you need to polyfill the [Web Crypto API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Crypto_API). This is not required if you're using runtimes other than Node.js (Deno, Bun, Cloudflare Workers, etc) or using Node.js v20 and above.

```ts
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
		"dev": "NODE_OPTIONS=--experimental-global-webcrypto remix dev",
		"start": "NODE_OPTIONS=--experimental-global-webcrypto remix start",
		"start": "NODE_OPTIONS=--experimental-global-webcrypto remix-serve build"
		// ...
	}
	// ...
}
```
