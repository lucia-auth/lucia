---
_order: 0
title: "Cloudflare KV (Binding)"
description: "Learn how to use Cloudflrae KV with Lucia"
---

A session adapter for Cloudlfare KV. A separate database/adapter is required for storing users and keys.

```ts
const adapter: (
	ns: KVNamespace,
	prefixes?: {
		session: string;
		userSessions: string;
	}
) => () => SessionAdapter;
```

### Parameter

| name | type        | description                                          |
| ---- | ----------- | ---------------------------------------------------- |
| ns   | KvNamespace | Cloudflare KV Binding namespace for storing sessions |

### Errors

The adapter and Lucia will not not handle [unknown errors](/basics/error-handling#known-errors), which are database errors Lucia doesn't expect the adapter to catch. When it encounters such errors, it will throw one of the Redis errors.

## Installation

```
npm i @lucia-auth/adapter-session-cloudflare-kv-binding
pnpm add @lucia-auth/adapter-session-cloudflare-kv-binding
yarn add @lucia-auth/adapter-session-cloudflare-kv-binding
```

For testing locally you can use [miniflare kv](https://www.npmjs.com/package/@miniflare/kv)

```
npm i -D @miniflare/kv @miniflare/storage-memory
pnpm add -D @miniflare/kv @miniflare/storage-memory
yarn add -D @miniflare/kv @miniflare/storage-memory
```

## Usage

You will need to set up a different adapter for storing users.

```ts
// lucia.js
import lucia from "lucia";
import cloudflareKvBinding from "@lucia-auth/adapter-session-cloudflare-kv-binding";
import prisma from "@lucia-auth/adapter-prisma";
import { KVNamespace } from "@miniflare/kv";
import { MemoryStorage } from "@miniflare/storage-memory";

const ns = new KVNamespace(new MemoryStorage());

export const auth = lucia({
	adapter: {
		user: prisma(), // any adapter
		session: cloudflareKvBinding(ns)
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
