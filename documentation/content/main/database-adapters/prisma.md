---
title: "Prisma adapter"
description: "Learn how to use Prisma with Lucia"
---

Adapters for [Prisma](https://www.prisma.io). We provide 3 variations:

- For MySQL, provided by `@lucia-auth/adapter-mysql`
- For PostgreSQL, provided by `@lucia-auth/adapter-postgressql`
- For SQLite, provided by `@lucia-auth/adapter-sqlite`

**Do not use mix adapters**, or else Lucia won't be properly handle errors. While not deprecated, **`@lucia-auth/adapter-prisma` is a legacy package and will be deprecated in the future.**

```ts
import { prisma } from "@lucia-auth/adapter-mysql";
import { prisma } from "@lucia-auth/adapter-postgresql";
import { prisma } from "@lucia-auth/adapter-sqlite";
```

```ts
const prisma: (
	client: PrismaClient,
	tableNames?: {
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
| `tableNames`         |                  |                                                      |    ✓     |
| `tableNames.user`    | `string`         |                                                      |          |
| `tableNames.key`     | `string`         |                                                      |          |
| `tableNames.session` | `string \| null` | Can be `null` when using alongside a session adapter |          |

The table names are your Prisma model names (with the upper case). If you use `@@map()`, use the true database table name instead.

## Installation

### MySQL

```
npm i @lucia-auth/adapter-mysql
pnpm add @lucia-auth/adapter-mysql
yarn add @lucia-auth/adapter-mysql
```

### PostgreSQL

```
npm i @lucia-auth/adapter-postgresql
pnpm add @lucia-auth/adapter-postgresql
yarn add @lucia-auth/adapter-postgresql
```

### SQLite

```
npm i @lucia-auth/adapter-sqlite
pnpm add @lucia-auth/adapter-sqlite
yarn add @lucia-auth/adapter-sqlite
```

## Usage

```ts
import { lucia } from "lucia";
import { prisma } from "@lucia-auth/adapter-mysql";
import { PrismaClient } from "@prisma/client";

const client = new PrismaClient();

const auth = lucia({
	adapter: prisma(client, {
		user: "User",
		key: "Key",
		session: "Session"
	})
	// ...
});
```

### In non-Node.js environment

To use Prisma in an environment that doesn't support Node.js (including Deno, Cloudflare Workers, Vercel Edge), import `PrismaClient` from `@prisma/client/edge` instead of `@prisma/client`.

```ts
import { PrismaClient } from "@prisma/client/edge";
```

## Prisma schema

You can add additional columns to the user model to store user attributes, and to the session model to store session attributes. While you can freely change the field names (e.g. `Session.userId`), **do not change the underlying column names** (e.g. `user_id`) inside `@map()`.

**The `id` fields are not UUID types with the default configuration.**

```prisma
model User {
  id       String    @id @unique @map("id")
  session  Session[]
  key      Key[]
}

model Session {
  id            String @id @unique @map("id")
  userId        String @map("user_id")
  activeExpires BigInt @map("active_expires")
  idleExpires   BigInt @map("idle_expires")
  user          User   @relation(references: [id], fields: [userId], onDelete: Cascade)

  @@index([userId])
}

model Key {
  id             String  @id @unique @map("id")
  hashedPassword String? @map("hashed_password")
  userId         String  @map("user_id")
  user           User    @relation(references: [id], fields: [userId], onDelete: Cascade)

  @@index([userId])
}
```
