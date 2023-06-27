---
menuTitle: "Redis"
title: "Redis session adapter"
description: "Learn how to use Redis with Lucia"
---

Session adapter for [Redis](https://redis.io) provided by the Redis session adapter package. This only handles sessions, and not users or keys.

```ts
import { redis } from "@lucia-auth/adapter-session-redis";
```

```ts
const redis: (
	client: RedisClientType,
	prefixes?: {
		session: string;
		userSessions: string;
	}
) => InitializeAdapter<SessionAdapter>;
```

##### Parameters

| name       | type                     | optional | description  |
| ---------- | ------------------------ | :------: | ------------ |
| `client`   | `RedisClientType`        |          | Redis client |
| `prefixes` | `Record<string, string>` |    ✓     | Key prefixes |

### Key prefixes

Key are defined as a combination of a prefix and an id so everything can be stored in a single Redis instance. By default, sessions are stored as `session:<session_id>` and user-sessions relationships are stored as `user_sessions:<user_id>`.

## Usage

```ts
import { lucia } from "lucia";
import { redis } from "@lucia-auth/adapter-session-redis";
import { createClient } from "redis";

const redisClient = createClient({
	// ...
});

const auth = lucia({
	adapter: {
		user: userAdapter, // any normal adapter for storing users/keys
		session: redis(redisClient)
	}
	// ...
});
```
