---
menuTitle: "Unstorage"
title: "Unstorage session adapter"
description: "Learn how to use Unstorage with Lucia"
---

Session adapter for [Unstorage](https://github.com/unjs/unstorage). This only handles sessions, and not users or keys. Supports many key-value databases, including Azure, Cloudflare KV, MongoDB, Planetscale, Redis, and Vercel KV, as well as in-memory.

```ts
import { unstorage } from "@lucia-auth/adapter-session-unstorage";
```

```ts
const unstorage: (
	storage: Storage,
	prefixes?: {
		session: string;
		userSession: string;
	}
) => InitializeAdapter<SessionAdapter>;
```

##### Parameters

| name       | type                     | optional | description  |
| ---------- | ------------------------ | :------: | ------------ |
| `storage`  | `Storage`                |          |              |
| `prefixes` | `Record<string, string>` |    ✓     | Key prefixes |

## Installation

```
npm i @lucia-auth/adapter-session-unstorage
pnpm add @lucia-auth/adapter-session-unstorage
yarn add @lucia-auth/adapter-session-unstorage
```

### Key prefixes

Key are defined as a combination of a prefix and an id so everything can be stored in a single storage instance. By default, sessions are stored as `session:<session_id>` and user-sessions relationships are stored as `user_sessions:<user_id>`.

## Usage

```ts
import { lucia } from "lucia";
import { unstorage } from "@lucia-auth/adapter-session-unstorage";
import { createStorage } from "unstorage";

const storage = createStorage();

const auth = lucia({
	adapter: {
		user: userAdapter, // any normal adapter for storing users/keys
		session: unstorage(storage)
	}
	// ...
});
```
