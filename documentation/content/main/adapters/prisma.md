---
_order: 0
title: "Prisma"
description: "Learn how to use Prisma with Lucia"
---

[Prisma](https://github.com/prisma/prisma) is an open source next-generation ORM.

An adapter for Prisma version 4.2 and greater. Can be used with: MySQL, PostgreSQL, SQLite, and MongoDB.

```ts
import prisma from "@lucia-auth/adapter-prisma";
import { PrismaClient } from "@prisma/client";

const client = new PrismaClient();

const auth = lucia({
	adapter: prisma(client)
});
```

```ts
const adapter: (client: PrismaClient) => () => Adapter;
```

> Version 2 of the adapter requires `lucia-auth` version 1.3.0 or greater

### Parameter

| name   | type           | description   | optional |
| ------ | -------------- | ------------- | -------- |
| client | `PrismaClient` | Prisma client |          |

### Errors

The adapter and Lucia will not not handle [unknown errors](/basics/error-handling#known-errors), which are database errors Lucia doesn't expect the adapter to catch. When it encounters such errors, it will throw one of these:

- `Prisma.PrismaClientKnownRequestError`
- `Prisma.PrismaClientValidationError`
- `Prisma.PrismaClientUnknownRequestError`
- `Prisma.PrismaClientInitializationError`
- `Prisma.PrismaClientRustPanicError`

## Installation

```
npm i @lucia-auth/adapter-prisma
pnpm add @lucia-auth/adapter-prisma
yarn add @lucia-auth/adapter-prisma
```

## Models

Make sure to generate your types using `npx prisma generate` after you set up the schema!

### `AuthUser`

You may add additional columns to store user attributes. Refer to [User attributes](/basics/user-attributes).

```prisma
model AuthUser {
  id           String    @id @unique
  auth_session AuthSession[]
  auth_key     AuthKey[]
  // here you can add custom fields for your user
  // e.g. name, email, username, roles, etc.

  @@map("auth_user")
}
```

### `AuthSession`

This is not required if you're only using the Prisma adapter for the `user` table via the [`adapter.user`](/basics/configuration#adapter) config.

```prisma
model AuthSession {
  id             String	@id @unique
  user_id        String
  active_expires BigInt
  idle_expires   BigInt
  auth_user      AuthUser   @relation(references: [id], fields: [user_id], onDelete: Cascade)

  @@index([user_id])
  @@map("auth_session")
}
```

### `AuthKey`

```prisma
model AuthKey {
  id              String  @id @unique
  hashed_password String?
  user_id         String
  primary_key     Boolean
  expires         BigInt?
  auth_user       AuthUser    @relation(references: [id], fields: [user_id], onDelete: Cascade)

  @@index([user_id])
  @@map("auth_key")
}
```

> You can only add custom fields to the user model. The session and key models are managed by Lucia, so you can't add custom fields to them.

### Define table names

You can configure your table names by changing `@@map()`:

```prisma
model AuthUser {
  // ...

  @@map("user")
}
```

## Using MongoDB

If you're looking to use Prisma with MongoDB the only change you need to make is to the `id` property. You need to change the `@unique` attribute to `@map("_id")`. Lucia under the hood generates a short id automatically for the 3 models (user, session, key) which means the id should not be auto-generated.

Replace `id String @id @unique` with `id String @id @map("_id")` in the 3 models (user, session, key) shown above.

```prisma
id String @id @map("_id")
```

Our `datasource` will also need to change to `provider = "mongodb"`.

```prisma
datasource db {
  provider = "mongodb"
  url      = env("DATABASE_URL")
}
```

## Using PlanetScale

Since PlanetScale does not support foreign keys, set `relationMode` to `prisma` inside the schema `datasource`. You can alternatively remove the foreign key constraint all together, though Lucia will not know if a user id is invalid on session or key creation.

```prisma
datasource db {
  provider     = "mysql"
  url          = env("DATABASE_URL")
  relationMode = "prisma"
}
```
