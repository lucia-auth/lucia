---
order: 1
layout: "@layouts/DocumentLayout.astro"
title: "Prisma"
---

An adapter for Prisma ORM. Can be used with: SQL, MySQL, PostgreSQL, and SQLite.

```ts
const adapter: (client: PrismaClient) => Adapter;
```

### Parameter

| name   | type           | description   |
| ------ | -------------- | ------------- |
| client | `PrismaClient` | Prisma client |

## Installation

```bash
npm i @lucia-sveltekit/adapter-prisma
pnpm add @lucia-sveltekit/adapter-prisma
yarn add @lucia-sveltekit/adapter-prisma
```

## Usage

```ts
import prisma from "@lucia-sveltekit/adapter-prisma";
import { PrismaClient } from "@prisma/client";

const client = new PrismaClient();

const auth = lucia({
    adapter: prisma(client),
});
```

## Schema

### `user`

You may add additional columns to store user attributes. Refer to [[Store user attributes](/learn/basics/store-user-attributes). `id` may be `String` if you generate your own user id.

```prisma
model User {
  id              String    @id @unique @default(cuid())
  provider_id     String    @unique
  hashed_password String?
  username        String    @unique
  session         Session[]

  @@map("user")
}
```

### `session`

```prisma
model Session {
  id           String @id @unique
  user_id      String
  expires      BigInt
  idle_expires BigInt
  user         User   @relation(references: [id], fields: [user_id], onDelete: Cascade)

  @@index([user_id])
  @@map("session")
}
```
