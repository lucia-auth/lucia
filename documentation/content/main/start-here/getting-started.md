---
_order: 1
title: "Getting started"
description: "Learn how to get started with Lucia"
---

Install Lucia using your package manager of your choice.

```bash
npm i lucia-auth
pnpm add lucia-auth
yarn add lucia-auth
```

### Framework integration

You can use Lucia as is, or with the provided framework support for a better DX.

If you're using one of the supported frameworks, follow the "Getting started" guides below instead of this page:

- [SvelteKit](/start-here/getting-started?framework=sveltekit)
- [Astro](/start-here/getting-started?framework=astro)
- [Next.js](/start-here/getting-started?framework=nextjs)

## Set up the database

To support multiple databases, Lucia uses database adapters. These adapters provide a set of standardized methods to read from and update the database. Custom adapters can be created as well if Lucia does not provide one.

Follow the guides below to set up your database:

- [Prisma](/database/prisma) (MySQL, SQLite, PostgreSQL)
- [Kysely](/database/kysely) (PostgreSQL, MySQL, SQLite)
- [Mongoose](/database/mongoose) (MongoDB).

## Initialize Lucia

In a TypeScript file, import [`lucia`](/reference/lucia-auth/auth) and an adapter (the adapters are provided as a different NPM package). Initialize it by defining `adapter` and `env` and export it. `env` should be set to `"DEV"` when testing in a HTTP environment (localhost), while it should be `"PROD"` if in a HTTPS environment.

```ts
// lucia.ts
import lucia from "lucia-auth";
import prisma from "@lucia-auth/adapter-prisma";
import { prismaClient } from "@prisma/client";

export const auth = lucia({
	adapter: prisma(prismaClient), // TODO: initialize Prisma client
	env: "DEV" // "PROD" if in prod
});

export type Auth = typeof auth;
```

This module **should NOT be imported from the client**.

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

**This is only required for Node.js v16-18.** Import `lucia-auth/polyfill/node` in `lucia.ts`.

```ts
// auth/lucia.ts
import lucia from "lucia-auth";
import "lucia-auth/polyfill/node"

// ...

export const auth = lucia({
	adapter: prisma(prismaClient),
	env: process.env.NODE_ENV === "development" ? "DEV" : "PROD",
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
globalThis.crypto = cryptoPolyfill;
```


## Next steps

We recommend reading the "Basics" section from top to bottom to get the gist of the library. Cheers and happy coding!
