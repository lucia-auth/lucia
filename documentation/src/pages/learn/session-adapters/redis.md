---
order: 0
layout: "@layouts/DocumentLayout.astro"
title: "Redis"
---

A session adapter for Redis.

```ts
const adapter: (redisClient: {
    session: RedisClientType;
    userSessions: RedisClientType;
}) => SessionAdapter;
```

#### Parameter

| name                     | type            | description                                                   |
| ------------------------ | --------------- | ------------------------------------------------------------- |
| redisClient.session      | RedisClientType | Client for Redis database for storing sessions                |
| redisClient.userSessions | RedisClientType | Client for Redis database for storing user-sessions relations |

## Installation

```bash
npm i @lucia-sveltekit/session-adapter-redis
pnpm add @lucia-sveltekit/session-adapter-redis
yarn add @lucia-sveltekit/session-adapter-redis
```

## Usage

You will need to set up a different adapter for storing users.

```ts
// lib/server/lucia.ts
import lucia from "lucia-sveltekit";
import redis from "@lucia-sveltekit/session-adapter-redis";
import prisma from "@lucia-sveltekit/adapter-prisma";
import { createClient } from "redis";

export const sessionClient = createClient();
export const userSessionsClient = createClient();

export const auth = lucia({
    adapter: {
        user: prisma(), // any adapter
        session: redis({
            session: sessionClient,
            userSessions: userSessionsClient,
        }),
    },
});
```

You can connect to your Redis instance inside hooks.

```ts
// hooks.server.ts
import { sessionClient, userSessionsClient } from "$lib/server/lucia";

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
