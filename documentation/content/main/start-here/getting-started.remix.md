---
_order: 1
title: "Getting started"
description: "Learn how to get started with Lucia using Remix"
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

In `auth/lucia.server.ts`, import [`lucia`](/reference/lucia-auth/auth) from `lucia-auth`. Initialize it by defining `adapter` and `env` and export it. Additionally, we will import the `web()` middleware and pass it on to `middleware`. Make sure to export `typeof auth` as well.

```ts
// auth/lucia.server.ts
import lucia from "lucia-auth";
import { web } from "lucia-auth/middleware";
import prisma from "@lucia-auth/adapter-prisma";
import { PrismaClient } from "@prisma/client";

export const auth = lucia({
	adapter: prisma(new PrismaClient()),
	env: "DEV", // "PROD" if prod
	middleware: web()
});

export type Auth = typeof auth;
```

This module and the file that holds it **should NOT be imported from the client**.

### Types

Create `lucia.d.ts`, and inside it configure your types. The path in `import('./auth/lucia.server.js').Auth;` is where you exported `auth` (`lucia()`).

```ts
// lucia.d.ts
/// <reference types="lucia-auth" />
declare namespace Lucia {
	type Auth = import("./auth/lucia.server.js").Auth;
	type UserAttributes = {};
}
```

## Configure your Remix project

Lucia is an ESM package and you must define all modules in `serverDependenciesToBundle`:

```ts
// remix.config.js

/** @type {import('@remix-run/dev').AppConfig} */
module.exports = {
	// ...
	serverDependenciesToBundle: [
		"lucia-auth",
		"lucia-auth/middleware",
		"@lucia-auth/adapter-prisma",
		"lucia-auth/polyfill/node",
		// if using oauth integration:
		"@lucia-auth/oauth",
		"@lucia-auth/oauth/providers"
	]
};
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

Alternatively, add the `--experimental-global-webcrypto` flag to the `dev` and `build` scripts:

```json
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

If you're using Node v14, you'll need to use a third party polyfill and set it as a global variable:

```ts
globalThis.crypto = webCryptoPolyfill;
```
