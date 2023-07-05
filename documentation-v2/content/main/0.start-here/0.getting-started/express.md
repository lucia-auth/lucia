---
order: 0
title: "Getting started in Express"
menuTitle: "Express"
description: "Learn how to set up Lucia in your Express project"
---

Install Lucia using your package manager of your choice.

```
npm i lucia
pnpm add lucia
yarn add lucia
```

### ESM

Lucia is an ESM only package. Make sure your package type is `module` and use ESM imports instead of CJS `require()`.

```json
// package.json
{
	"type": "module"
}
```

## Initialize Lucia

Import [`lucia()`](/reference/lucia/main#lucia) from `lucia` and initialize it. Export `auth` and its type as `Auth`. Make sure to pass the `express()` middleware We also need to provide an `adapter` but since it'll be specific to the database you're using, we'll cover that later.

```ts
// lucia.ts
import { lucia } from "lucia";
import { express } from "lucia/middleware";

// expect error
export const auth = lucia({
	env: "DEV", // "PROD" if deployed to HTTPS
	middleware: express()
});

export type Auth = typeof auth;
```

## Setup your database

Lucia uses adapters to connect to your database. We provide official adapters for a wide range of database options, but you can always [create your own](/extending-lucia/database-adapters-api). The schema and usage are described in each adapter's documentation. The example below is for the Prisma adapter.

```ts
import { lucia } from "lucia";
import { express } from "lucia/middleware";
import { prisma } from "@lucia-auth/adapter-prisma";
import { PrismaClient } from "@prisma/client";

const client = new PrismaClient();

const auth = lucia({
	env: "DEV", // "PROD" if deployed to HTTPS
	middleware: express(),
	adapter: prisma(client)
});
```

### Adapters for database drivers and ORMs

- [`better-sqlite3`](/database-adapters/better-sqlite3): SQLite
- [libSQL](/database-adapters/libSQL): libSQL (Turso)
- [Mongoose](/database-adapters/mongoose): MongoDB
- [`mysql2`](/database-adapters/mysql2): MySQL
- [`pg`](/database-adapters/pg): PostgreSQL
- [`postgres`](/database-adapters/postgres): PostgreSQL
- [Prisma](/database-adapters/prisma): MongoDB, MySQL, PostgreSQL, SQLite
- [Redis](/database-adapters/redis): Redis

### Provider specific adapters

- [Cloudflare D1](/database-adapters/cloudflare-d1)
- [PlanetScale serverless](/database-adapters/planetscale-serverless)
- [Upstash](/database-adapters/upstash)

## Set up types

Create a `.d.ts` file and declare a `Lucia` namespace. The import path for `Auth` is where you initialized `lucia()`.

```ts
// app.d.ts
/// <reference types="lucia" />
declare namespace Lucia {
	type Auth = import("./lucia.js").Auth;
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

Optionally, instead of doing a side-effect import, add the `--experimental-global-webcrypto` flag when running `node`.

```
node --experimental-global-webcrypto index.js
```

## Middleware

This is optional but highly recommended. Create a new middleware that stores [`Auth`](/reference/lucia/interfaces/authrequest) to `res.locals.auth` (or `req.locals`).

```ts
import express from "express";

const app = express();

app.use((req, res, next) => {
	res.locals.auth = auth.handleRequest(req, res);
	return next();
});
```

This allows us to validate sessions using a single line of code.

```ts
app.get("/", async (req, res) => {
	const session = await res.locals.validate();
});
```
