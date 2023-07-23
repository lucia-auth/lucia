---
menuTitle: "Prisma"
title: "Prisma adapter"
description: "Learn how to use Prisma with Lucia"
---

Adapter for [Prisma](https://www.prisma.io) provided by the Prisma adapter package. There are 2 ways to initialize it.

```ts
import { prisma } from "@lucia-auth/adapter-prisma";
```

```ts
const prisma: (
	client: PrismaClient,
	modelNames?: {
		user: string;
		key: string;
		session: string | null;
	}
) => InitializeAdapter<Adapter>;
```

##### Parameters

| name                 | type             | description                                          | optional |
| -------------------- | ---------------- | ---------------------------------------------------- | :------: |
| `client`             | `PrismaClient`   | The Prisma client                                    |          |
| `modelNames`         |                  |                                                      |    ✓     |
| `modelNames.user`    | `string`         |                                                      |          |
| `modelNames.key`     | `string`         |                                                      |          |
| `modelNames.session` | `string \| null` | Can be `null` when using alongside a session adapter |          |

The values for the `modelNames` params is the `camelCase` version of your `PascalCase` model names defined in your schema (sounds confusing but the TS auto-complete should help you). When it's undefined, the adapter uses predefined model names (see below).

## Installation

```
npm i @lucia-auth/adapter-prisma@beta
pnpm add @lucia-auth/adapter-prisma@beta
yarn add @lucia-auth/adapter-prisma@beta
```

## Usage

```ts
import { lucia } from "lucia";
import { prisma } from "@lucia-auth/adapter-prisma";
import { PrismaClient } from "@prisma/client";

const client = new PrismaClient();

const auth = lucia({
	adapter: prisma(client)
	// ...
});

// default values
const auth = lucia({
	adapter: prisma(client, {
		user: "user", // model User {}
		key: "key", // model Key {}
		session: "session" // model Session {}
	})
	// ...
});
```

## Prisma schema

You can add additional columns to the user model to store user attributes, and to the session model to store session attributes. If you change the model names, pass the new names to the adapter config.

```prisma
model User {
  id           String    @id @unique

  auth_session Session[]
  auth_key     Key[]
}

model Session {
  id             String @id @unique
  user_id        String
  active_expires BigInt
  idle_expires   BigInt
  user           User   @relation(references: [id], fields: [user_id], onDelete: Cascade)

  @@index([user_id])
}

model Key {
  id              String  @id @unique
  hashed_password String?
  user_id         String
  user            User    @relation(references: [id], fields: [user_id], onDelete: Cascade)

  @@index([user_id])
}
```
