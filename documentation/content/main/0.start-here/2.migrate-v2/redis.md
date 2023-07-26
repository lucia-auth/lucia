---
order: 0
title: "Update your Redis instance to Lucia v2"
---

Install the latest version of the Redis adapter.

```
npm i @lucia-auth/adapter-session-redis@latest
pnpm add @lucia-auth/adapter-session-redis@latest
yarn add @lucia-auth/adapter-session-redis@latest
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
