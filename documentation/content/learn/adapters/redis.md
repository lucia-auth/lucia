---
order: 1
title: "Redis (session)"
---

A session adapter for Redis.

```ts
const adapter: (
	redisClient: {
		session: RedisClientType;
		userSessions: RedisClientType;
	},
	handleError?: (error: any) => void
) => SessionAdapter;
```

#### Parameter

| name                     | type            | description                                                   | optional |
| ------------------------ | --------------- | ------------------------------------------------------------- | -------- |
| redisClient.session      | RedisClientType | client for Redis database for storing sessions                |          |
| redisClient.userSessions | RedisClientType | client for Redis database for storing user-sessions relations |          |
| handleError              | `Function`      |                                                               | true     |

## Installation

```bash
npm i @lucia-auth/session-adapter-redis
pnpm add @lucia-auth/session-adapter-redis
yarn add @lucia-auth/session-adapter-redis
```

## Usage

You will need to set up a different adapter for storing users.

```ts
// lucia.js
import lucia from "lucia-auth";
import redis from "@lucia-auth/session-adapter-redis";
import prisma from "@lucia-auth/adapter-prisma";
import { createClient } from "redis";

export const sessionClient = createClient();
export const userSessionsClient = createClient();

export const auth = lucia({
	adapter: {
		user: prisma(), // any adapter
		session: redis({
			session: sessionClient,
			userSessions: userSessionsClient
		})
	}
});
```

You will have to handle the database connection as well.

```ts
// db.ts
import { sessionClient, userSessionsClient } from "./lucia.js";

sessionClient.connect();
userSessionsClient.connect();
```

## Models

### `session`

| key                  | value                                                                                     |
| -------------------- | ----------------------------------------------------------------------------------------- |
| session id: `string` | stringified [`SessionSchema`](/reference/adapters/database-model#schema-type-1): `string` |

### `userSessions`

| key               | value                           |
| ----------------- | ------------------------------- |
| user id: `string` | list of session ids: `string[]` |
