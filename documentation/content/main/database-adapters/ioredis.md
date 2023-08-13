---
menuTitle: "`ioredis`"
title: "`ioredis` session adapter"
description: "Learn how to use `ioredis` with Lucia"
---

Session adapter for [`ioredis`](https://github.com/redis/ioredis) provided by the Redis session adapter package. This only handles sessions, and not users or keys.

```ts
import { ioredis } from "@lucia-auth/adapter-session-redis";
```

```ts
const ioredis: (
	client: Redis,
	prefixes?: {
		session: string;
		userSessions: string;
	}
) => InitializeAdapter<SessionAdapter>;
```

##### Parameters

| name       | type                     | optional | description      |
| ---------- | ------------------------ | :------: | ---------------- |
| `client`   | `Redis`                  |          | `ioredis` client |
| `prefixes` | `Record<string, string>` |    ✓     | Key prefixes     |

## Installation

```
npm i @lucia-auth/adapter-session-redis
pnpm add @lucia-auth/adapter-session-redis
yarn add @lucia-auth/adapter-session-redis
```

### Key prefixes

Key are defined as a combination of a prefix and an id so everything can be stored in a single Redis instance. By default, sessions are stored as `session:<session_id>` and user-sessions relationships are stored as `user_sessions:<user_id>`.

## Usage

```ts
import { lucia } from "lucia";
import { ioredis } from "@lucia-auth/adapter-session-redis";
import { Redis } from "ioredis";

const redisClient = new Redis(/* … */);

const auth = lucia({
	adapter: {
		user: userAdapter, // any normal adapter for storing users/keys
		session: ioredis(redisClient)
	}
	// ...
});
```
