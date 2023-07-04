---
_order: 1
title: "Getting started"
description: "Learn how to get started with Lucia using Qwik"
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

In `$lib/server/lucia.ts`, import [`lucia`](/reference/lucia-auth/auth) from `lucia-auth`. Initialize it by defining `adapter` and `env` and export it. Additionally, we will import the Qwik middleware and pass it on to `middleware`. Make sure to export `typeof auth` as well.

```ts
// src/lib/lucia.ts
import lucia from "lucia-auth";
import { qwik } from "lucia-auth/middleware";
import prismaAdapter from "@lucia-auth/adapter-prisma";
import { PrismaClient } from "@prisma/client";

export const auth = lucia({
	adapter: prismaAdapter(new PrismaClient()),
	env: "DEV", // "PROD" if prod
	middleware: qwik()
});

export type Auth = typeof auth;
```

This module and the file that holds it **should NOT be imported from the client**.

### Types

Create lucia.d.ts, and inside it configure your types. The path in import('./lib/lucia.js').Auth; is where you exported auth (lucia()).

```ts
// src/lucia.d.ts
/// <reference types="lucia-auth" />
declare namespace Lucia {
	type Auth = import("./lib/lucia.js").Auth;
	type UserAttributes = {};
}
```
