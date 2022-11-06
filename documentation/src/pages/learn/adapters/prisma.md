---
order: 0
layout: "@layouts/DocumentLayout.astro"
title: "Prisma"
---

An adapter for Prisma ORM. Can be used with: SQL, MySQL, PostgreSQL, and SQLite.

```ts
const adapter: (
	client: PrismaClient,
	handleError?: (
		error:
			| Prisma.PrismaClientKnownRequestError
			| Prisma.PrismaClientValidationError
			| Prisma.PrismaClientUnknownRequestError
			| Prisma.PrismaClientInitializationError
			| Prisma.PrismaClientRustPanicError
	) => void
) => Adapter;
```

### Parameter

`handleError()` may be provided which will be called on [unknown errors](/learn/basics/handle-errors#known-errors) - database errors Lucia doesn't expect the adapter to catch. You can also throw custom errors inside it, which will be thrown when an unknown database error occurs inside [`Lucia`](/reference/api/server-api#lucia) methods.

| name        | type           | description   | optional |
| ----------- | -------------- | ------------- | -------- |
| client      | `PrismaClient` | Prisma client |          |
| handleError | `Function`     |               | true     |

### Errors

When an adapter encounters an unknown error (described above), it will throw one of:

- `Prisma.PrismaClientKnownRequestError`
- `Prisma.PrismaClientValidationError`
- `Prisma.PrismaClientUnknownRequestError`
- `Prisma.PrismaClientInitializationError`
- `Prisma.PrismaClientRustPanicError`

## Installation

```bash
npm i @lucia-auth/adapter-prisma
pnpm add @lucia-auth/adapter-prisma
yarn add @lucia-auth/adapter-prisma
```

## Usage

```ts
import prisma from "@lucia-auth/adapter-prisma";
import { PrismaClient } from "@prisma/client";

const client = new PrismaClient();

const auth = lucia({
	adapter: prisma(client)
});
```

## Schema

Make sure to generate your types using `npx prisma generate` after you set up the schema!

### `user`

You may add additional columns to store user attributes. Refer to [Store user attributes](/learn/basics/store-user-attributes). `id` may be `String` if you generate your own user id.

```prisma
model User {
  id              String    @id @unique @default(cuid())
  provider_id     String    @unique
  hashed_password String?
  session         Session[]

  @@map("user")
}
```

### `session`

You do not need this if you're using the adapter for [`adapter.user`](/reference/configure/lucia-configurations#adapter) config.

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
