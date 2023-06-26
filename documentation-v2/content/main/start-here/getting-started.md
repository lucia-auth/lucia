---
order: 1
title: "Getting started"
description: "Learn how to set up Lucia in your project"
---

Install Lucia using your package manager of your choice.

```
npm i lucia
pnpm add lucia
yarn add lucia
```

## Initialize Lucia

Import [`lucia()`](/reference/lucia/main#lucia) from `lucia` and initialize it in its own module (file). Export `auth` and its type as `Auth`. We also need to provide an `adapter` but since it'll be specific to the database you're using, we'll cover that later.

```ts
// lucia.ts
import { lucia } from "lucia";

// expect error
export const auth = lucia({
	env: "DEV" // "PROD" if deployed to HTTPS
});

export type Auth = typeof auth;
```

### Middleware

[Middleware](/basics/handle-requests) allows Lucia to read the request and response since these are different across frameworks and runtime. See [a full list of middleware](/basics/handle-requests#list-of-middleware-and-examples).

#### Node.js

Use the Node.js middleware if you're using Node.js' `IncomingMessage` and `OutgoingMessage`.

```ts
import { lucia } from "lucia";
import { node } from "lucia/middleware";

export const auth = lucia({
	env: "DEV", // "PROD" if deployed to HTTPS
	middleware: node()
});
```

#### Web standard

Use the web standard middleware if you're using the standard `Request` and `Response`.

```ts
import { lucia } from "lucia";
import { web } from "lucia/middleware";

export const auth = lucia({
	env: "DEV", // "PROD" if deployed to HTTPS
	middleware: web(),
	sessionCookie: {
		expires: false
	}
});
```

## Setup your database

Lucia uses adapters to connect to your database. We provide official adapters for a wide range of database options, but you can always [create your own](/extending-lucia/database-adapters-api). The schema and usage are described in each adapter's documentation. The example below is for the Prisma adapter.

```ts
import { lucia } from "lucia";
import { prisma } from "@lucia-auth/adapter-prisma";
import { PrismaClient } from "@prisma/client";

const client = new PrismaClient();

const auth = lucia({
	env: "DEV", // "PROD" if deployed to HTTPS
	adapter: prisma(client)
});
```

### Adapters for database drivers and ORMs

- [`better-sqlite3`](/database-adapters/better-sqlite3): SQLite
- [Mongoose](/database-adapters/mongoose): MongoDB
- [`mysql2`](/database-adapters/mysql2): MySQL
- [`pg`](/database-adapters/pg): PostgreSQL
- [Prisma](/database-adapters/prisma): MongoDB, MySQL, PostgreSQL, SQLite
- [Redis](/database-adapters/redis): Redis

### Provider specific adapters

- [Cloudflare D1](/database-adapters/cloudflare-d1)
- [PlanetScale serverless](/database-adapters/planetscale-serverless)

## Set up types

Create a `.d.ts` file and declare a `Lucia` namespace. The import path for `Auth` is where you initialized `lucia()`.

```ts
// env.d.ts
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
