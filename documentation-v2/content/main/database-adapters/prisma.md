---
order: 0
title: "Prisma"
description: "Learn how to use Prisma with Lucia"
---

Adapter for [Prisma]() provided by the Prisma adapter package. There are 2 ways to initialize it.

```ts
import { prisma } from "@lucia-auth/adapter-prisma";
```

```ts
const prisma: (config: {
	client: PrismaClient;
	mode: "default";
}) => InitializeAdapter<Adapter>;

const prisma: (config: {
	client: PrismaClient;
	modelNames: {
		user: string;
		key: string;
		session: string;
	};
	userRelationKey: string;
}) => InitializeAdapter<Adapter>;
```

##### Parameters

| name   | type           | description       |
| ------ | -------------- | ----------------- |
| client | `PrismaClient` | The Prisma client |
| mode   | `"default"`    | Default mode      |

| name               | type           | description       |
| ------------------ | -------------- | ----------------- |
| client             | `PrismaClient` | The Prisma client |
| modelNames.user    | `string`       |                   |
| modelNames.key     | `string`       |                   |
| modelNames.session | `string`       |                   |
| userRelationKey    | `string`       |                   |

### Default mode

When using the default mode, the adapter uses predefined adapter configs, and as such, your Prisma schema must match exactly the one listed below this page. You can still add columns to the user and session table.

The values for the `modelNames` params of the adapter config is the `camelCase` version of your `PascalCase` model names defined in your schema (sounds confusing but the TS auto-complete should help you). The `userRelationKey` is key that represents foreign key relations (`user_relation_key` in the example):

```prisma
user_relation_key User @relation(references: [id], fields: [user_id], onDelete: Cascade)
```

## Installation

```
npm i @lucia-auth/adapter-prisma
pnpm add @lucia-auth/adapter-prisma
yarn add @lucia-auth/adapter-prisma
```

## Usage

```ts
import { lucia } from "lucia";
import { prisma } from "@lucia-auth/adapter-prisma";
import { PrismaClient } from "@prisma/client";

const client = new PrismaClient();

const auth = lucia({
	adapter: prisma({
		mode: "default",
		client
	})
	// ...
});

// default mode values
const auth = lucia({
	adapter: prisma({
		client,
		modelNames: {
			user: "user",
			key: "key",
			session: "session"
		},
		userRelationKey: "user"
	})
	// ...
});
```

## Prisma schema

You can add additional columns to the user model to store user attributes, and to the session model to store session attributes. **Your schema must exactly match this if you're using the default mode** (you can still add columns for attributes).

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
  // pass this key to `userRelationKey`
  user           User   @relation(references: [id], fields: [user_id], onDelete: Cascade)

  @@index([user_id])
}

model Key {
  id              String  @id @unique
  hashed_password String?
  user_id         String
  // pass this key to `userRelationKey`
  user            User    @relation(references: [id], fields: [user_id], onDelete: Cascade)

  @@index([user_id])
}
```
