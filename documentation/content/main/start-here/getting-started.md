---
_order: 1
title: "Getting started"
description: "Learn how to get started with Lucia"
---

Install Lucia using your package manager of your choice.

```
npm i lucia-auth
pnpm add lucia-auth
yarn add lucia-auth
```

### Framework integration

You can use Lucia as is, or with the provided framework middleware for a better DX.

If you're using one of the supported frameworks, follow the "Getting started" guides below instead of this page:

- [SvelteKit](/start-here/getting-started?sveltekit)
- [Astro](/start-here/getting-started?astro)
- [Next.js](/start-here/getting-started?nextjs)

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

In a TypeScript file, import [`lucia`](/reference/lucia-auth/auth) and an adapter (the adapters are provided as a different NPM package). Initialize it by defining `adapter` and `env` and export it. `env` should be set to `"DEV"` when testing in a HTTP environment (localhost), while it should be `"PROD"` if in a HTTPS environment.

```ts
// lucia.ts
import lucia from "lucia-auth";
import prisma from "@lucia-auth/adapter-prisma";
import { PrismaClient } from "@prisma/client";

export const auth = lucia({
	adapter: prisma(new PrismaClient()),
	env: "DEV" // "PROD" if in prod
});

export type Auth = typeof auth;
```

This module **should NOT be imported from the client**.

### Node.js

If you're using Node as is for handling requests, use the [Node middleware](/reference/lucia-auth/middleware#node):

```ts
import lucia from "lucia-auth";
import { node } from "lucia-auth/middleware";
// ...

export const auth = lucia({
	//...
	middleware: node()
});
```

### Express

If you are using Express for handling requests, use the [Express middleware](/reference/lucia-auth/middleware#express):

```ts
import lucia from "lucia-auth";
import { express } from "lucia-auth/middleware";
// ...

export const auth = lucia({
	//...
	middleware: express()
});
```

### Web standard

And, if you're dealing with the standard `Request`/`Response`, use the [Web middleware](/reference/lucia-auth/middleware#web):

```ts
import lucia from "lucia-auth";
import { web } from "lucia-auth/middleware";
// ...

export const auth = lucia({
	//...
	middleware: web()
});
```

This is intended for projects (including Next.js) deployed to the Edge runtime (Vercel Edge, Cloudflare Pages/Workers, etc).

## Configure type definition

In a TypeScript declaration file (`.d.ts`), declare a `Lucia` namespace. The path in `import('./lucia').Auth;` is where you exported `auth` (`lucia()`).

```ts
// app.d.ts
/// <reference types="lucia-auth" />
declare namespace Lucia {
	type Auth = import("./lucia.js").Auth;
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
	adapter: prisma(prismaClient),
	env: "DEV", // "PROD" if prod
	middleware: node()
});

export type Auth = typeof auth;
```

Alternatively, add the `--experimental-global-webcrypto` flag when running `node`:

```
node --experimental-global-webcrypto index.js
```

If you're using Node v14, you'll need to use a third party polyfill and set it as a global variable:

```ts
globalThis.crypto = webCryptoPolyfill;
```

## Next steps

We recommend reading the "Basics" section from top to bottom to get the gist of the library. Cheers and happy coding!
