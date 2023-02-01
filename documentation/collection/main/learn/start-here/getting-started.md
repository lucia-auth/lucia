---
_order: 2
title: "Getting started"
---

Install Lucia using your package manager of your choice.

```bash
npm i lucia-auth
pnpm add lucia-auth
yarn add lucia-auth
```

## Set up the database

To support multiple databases, Lucia uses database adapters. These adapters provide a set of standardized methods to read from and update the database. Custom adapters can be created as well if Lucia does not provide one.

Follow the guides below to set up your database:

- [Prisma](/learn/adapters/prisma) (MySQL, SQLite, PostgreSQL)
- [Kysely](/learn/adapters/kysely) (PostgreSQL, MySQL, SQLite)
- [Supabase](/learn/adapters/supabase)
- [Mongoose](/learn/adapters/mongoose) (MongoDB).

## Framework integration

You can use Lucia as is, or with one of the provided framework integration. These are wrapper libraries that provide APIs that make working with Lucia a bit more easier, so you still need to learn the APIs of the core Lucia library.

If you're using one the supported frameworks, follow the "Getting started" guides below in favor of this page:

- [SvelteKit](/sveltekit/start-here/getting-started)
- [Astro](/astro/start-here/getting-started)
- [Next.js](/nextjs/start-here/getting-started)

## Initialize Lucia

In a TypeScript file, import [`lucia`](/reference/api/server-api#lucia-default) and an adapter (the adapters are provided as a different NPM package).

```ts
// lucia.ts
import lucia from "lucia-auth";
import prisma from "@lucia-auth/adapter-prisma";
```

Initialize it and export it as `auth`. As for the config, `adapter` is your database adapter and [`env`](/reference/configure/lucia-configurations#env) tells Lucia what environment the server is running on. In the code below, `NODE_ENV` is an environment variable with a value of `DEV` or `PROD`.

```ts
// lucia.ts
import lucia from "lucia-auth";
import prisma from "@lucia-auth/adapter-prisma";

export const auth = lucia({
	adapter: prisma(prismaClient), // TODO: initialize Prisma client
	env: process.env.NODE_ENV.
});

export type Auth = typeof auth;
```

This module **should NOT be imported from the client**.

## Configure type definition

In TypeScript declaration file (`.d.ts`), declare a `Lucia` namespace. The path in `import('./lucia').Auth;` is where you exported `auth` (`lucia()`).

```ts
// app.d.ts
/// <reference types="lucia-auth" />
declare namespace Lucia {
	type Auth = import("./lucia.js").Auth;
	type UserAttributes = {};
}
```

## Next steps

We recommend reading the "Basics" section from top to bottom to get the gist of the library. Cheers and happy coding!
