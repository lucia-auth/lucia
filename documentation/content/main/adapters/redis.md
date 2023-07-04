---
_order: 0
title: "Redis"
description: "Learn how to use Redis with Lucia"
---

A session adapter for Redis. YA separate database/adapter is required for storing users and keys.

```ts
const adapter: (redisClient: {
	session: RedisClientType;
	userSession: RedisClientType;
}) => () => SessionAdapter;
```

### Parameter

| name                    | type            | description                                                   |
| ----------------------- | --------------- | ------------------------------------------------------------- |
| redisClient.session     | RedisClientType | client for Redis database for storing sessions                |
| redisClient.userSession | RedisClientType | client for Redis database for storing user-sessions relations |

### Errors

The adapter and Lucia will not not handle [unknown errors](/basics/error-handling#known-errors), which are database errors Lucia doesn't expect the adapter to catch. When it encounters such errors, it will throw one of the Redis errors.

## Installation

```
npm i @lucia-auth/adapter-session-redis
pnpm add @lucia-auth/adapter-session-redis
yarn add @lucia-auth/adapter-session-redis
```

## Usage

You will need to set up a different adapter for storing users.

```ts
// lucia.js
import lucia from "lucia-auth";
import redis from "@lucia-auth/adapter-session-redis";
import prisma from "@lucia-auth/adapter-prisma";
import { createClient } from "redis";

export const sessionClient = createClient();
export const userSessionClient = createClient();

export const auth = lucia({
	adapter: {
		user: prisma(), // any adapter
		session: redis({
			session: sessionClient,
			userSession: userSessionClient
		})
	}
});
```

You will have to handle the database connection as well.

```ts
// db.ts
import { sessionClient, userSessionClient } from "./lucia.js";

sessionClient.connect();
userSessionClient.connect();
```

## Models

### `session`

| key                  | value                                                                                            |
| -------------------- | ------------------------------------------------------------------------------------------------ |
| session id: `string` | stringified [`SessionSchema`](/reference/lucia-auth/types#sessionschema#schema-type-1): `string` |

### `userSession`

| key               | value                           |
| ----------------- | ------------------------------- |
| user id: `string` | list of session ids: `string[]` |
