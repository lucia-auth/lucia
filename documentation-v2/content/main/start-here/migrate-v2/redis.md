---
order: 0
title: "Update your Redis instance to Lucia v2"
---

Install the latest beta of the Redis adapter.

```
npm i @lucia-auth/adapter-session-redis@beta
pnpm add @lucia-auth/adapter-session-redis@beta
yarn add @lucia-auth/adapter-session-redis@beta
```

The Redis adapter now uses a single Redis instance of 2, and as such previous data must be deleted.

```ts
import { lucia } from "lucia";
import { redis } from "@lucia-auth/adapter-session-redis";
import { createClient } from "redis";

const redisClient = createClient({
	// ...
});

const auth = lucia({
	adapter: {
		session: redis(redisClient)
	}
	// ...
});
```
