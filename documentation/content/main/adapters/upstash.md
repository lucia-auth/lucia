---
_order: 0
title: "Upstash Redis"
description: "Learn how to use Upstash Redis with Lucia"
---

A session adapter for Upstash Redis. A separate database/adapter is required for storing users and keys.

```ts
const adapter: (upstashClient: Redis) => () => SessionAdapter;
```

### Parameter

| name          | type  | description                                              |
| ------------- | ----- | -------------------------------------------------------- |
| upstashClient | Redis | Serverless redis client for upstash for storing sessions |

### Errors

The adapter and Lucia will not not handle [unknown errors](/basics/error-handling#known-errors), which are database errors Lucia doesn't expect the adapter to catch. When it encounters such errors, it will throw one of the Redis errors.

## Installation

```
npm i @lucia-auth/adapter-session-upstash
pnpm add @lucia-auth/adapter-session-upstash
yarn add @lucia-auth/adapter-session-upstash
```

## Usage

You will need to set up a different adapter for storing users.

```ts
// lucia.js
import lucia from "lucia-auth";
import upstashAdapter from "@lucia-auth/adapter-session-upstash";
import prisma from "@lucia-auth/adapter-prisma";
import { createClient } from "redis";
import { Redis } from "@upstash/redis";

const upstashClient = new Redis({
	url: "YOUR_UPSTASH_URL",
	token: "YOUR_UPSTASH_TOKEN"
});

export const auth = lucia({
	adapter: {
		user: prisma(), // any adapter
		session: upstashAdapter(upstashClient)
	}
});
```
