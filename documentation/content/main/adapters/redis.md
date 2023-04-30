---
_order: 0
title: "Redis"
description: "Learn how to use Redis with Lucia"
---

A session adapter for Redis. YA separate database/adapter is required for storing users and keys.

```ts
const adapter: (
	redisClient: RedisClientType,
	options?: { namesspaces?: { session?: string; userSession?: string } }
) => () => SessionAdapter;
```

### Parameter

| name                          | type            | description                                                                                       | default     |
| ----------------------------- | --------------- | ------------------------------------------------------------------------------------------------- | ----------- |
| redisClient                   | RedisClientType | client for Redis database it uses namespace to differenetiate sessions to user-sessions relations |             |
| options.namespaces.session     | string          | namespace used for the sessions data, used like `${options.namespace.session}:${sessionId}`       | session     |
| options.namespaces.userSession | string          | namespace used for the user-sessions data, used like `${options.namespace.user}:${userId}`        | userSession |

### Errors

The adapter and Lucia will not not handle [unknown errors](/basics/error-handling#known-errors), which are database errors Lucia doesn't expect the adapter to catch. When it encounters such errors, it will throw one of the Redis errors.

## Installation

```bash
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

export const redisClient = createClient();

export const auth = lucia({
	adapter: {
		user: prisma(), // any adapter
		session: redis(redisClient)
	}
});
```

If you need to customize the namespaces used in Redis by the adapter, you can pass custom one inside the options.

```ts
// lucia.js
import redis from "@lucia-auth/adapter-session-redis";
import { createClient } from "redis";

export const redisClient = createClient();

export const redisAdapter = redis(redisClient, {
	namespaces: { session: "session", userSession: "userSession" }
});
```

You will have to handle the database connection as well, you must call the `.connect()` method on the redis client (if needed).

## Models

### `session`

| key                                          | value                                                                                            |
| -------------------------------------------- | ------------------------------------------------------------------------------------------------ |
| `${options.namespaces.session}:${sessionId}` | stringified [`SessionSchema`](/reference/lucia-auth/types#sessionschema#schema-type-1): `string` |

### `userSession`

| key                                           | value                           |
| --------------------------------------------- | ------------------------------- |
| `${options.namespaces.userSession}:${userId}` | list of session ids: `string[]` |

## Notes

### Breaking changes:

- `1.1.0`: the adapter now uses namespaces and a single redis connection. This means that you will have to change the redis client. You can find more information in the [usage](#usage) section.

### Changes on Lucia models

When you are using Redis for sessions, you might want to change the models used by the user adapter.

For example:

- Prisma : you can remove the `auth_session` field from the `AuthUser` model and remove the whole `AuthSession` model.
- Mongoose : you can remove the whole `auth_session` model.

### Custom usages

- The adapter don't have access to the user adapter, so it can't validate if the user exists. This means that when you call `adapter.setSession()`, the adapter will store the session even if the user doesn't exist.
