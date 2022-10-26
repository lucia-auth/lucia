---
order: 2
layout: "@layouts/DocumentLayout.astro"
title: "Getting started"
---

Install Lucia using your package manager of your choice.

```bash
npm i lucia-auth
pnpm add lucia-auth
yarn add lucia-auth
```

## Set up the database

Lucia currently supports multiple databases: [Prisma](/learn/adapters/prisma) (SQL, MySQL, SQLite, PostgreSQL), [Supabase](/learn/adapters/supabase), and [Mongoose](/learn/adapters/mongoose) (MongoDB). Please follow each adapter's instruction for this step.

You can also use a different database for storing sessions, such as [Redis](/learn/session-adapters/redis). Refer to [`configs.adapter`](/reference/configure/lucia-configurations#adapter).

## Initialize Lucia

In a TypeScript file, import [`lucia`](/reference/api/server-api#lucia) and an adapter (the adapters are provided as a different NPM package).

```ts
// lucia.js
import lucia from "lucia-auth";
import prisma from "@lucia-auth/adapter-prisma";
```

Initialize it by calling `lucia()` and export it as `auth`. `adapter` is your database adapters, and [`env`](/reference/configure/lucia-configurations#env) tells Lucia what environment the server is running on. In the code below, `NODE_ENV` is an environment variable with a value of `DEV` or `PROD`.

```ts
// lucia.js
import lucia from "lucia-auth";
import prisma from "@lucia-auth/adapter-prisma";

export const auth = lucia({
	adapter: prisma(prismaClient), // TODO: initialize Prisma client
	env: process.env.NODE_ENV.
});

export type Auth = typeof auth;
```

This module and the file that holds it **should NOT be imported from the client**.

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