---
order: 0
title: "Upstash"
description: "Learn how to use Upstas Redis with Lucia"
---

Session adapter for [Upstash Redis](https://upstash.com) provided by the Redis session adapter package. This only handles sessions, and not users or keys.

```ts
import { upstash } from "@lucia-auth/adapter-session-redis";
```

```ts
const upstash: (
	upstashClient: Redis,
	prefixes?: {
		session: string;
		userSessions: string;
	}
) => InitializeAdapter<SessionAdapter>;
```

##### Parameters

| name            | type                     | optional | description                          |
| --------------- | ------------------------ | :------: | ------------------------------------ |
| `upstashClient` | `Redis`                  |          | Serverless redis client for upstash. |
| `prefixes`      | `Record<string, string>` |    ✓     | Key prefixes                         |

### Key prefixes

Key are defined as a combination of a prefix and an id so everything can be stored in a single Redis instance. By default, sessions are stored as `session:<session_id>` and user-sessions relationships are stored as `user_sessions:<user_id>`.

## Usage

```ts
import { lucia } from "lucia";
import { upstash } from "@lucia-auth/adapter-session-redis";
import { Redis } from "@upstash/redis";

const upstashClient = new Redis({
	// ...
});

const auth = lucia({
	adapter: {
		user: userAdapter, // any normal adapter for storing users/keys
		session: upstash(upstashClient)
	}
	// ...
});
```
