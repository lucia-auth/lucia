---
_order: 0
title: "Unstorage"
description: "Learn how to use Unstorage with Lucia"
---

A session adapter for Unstorage. A separate database/adapter is required for storing users and keys.
[Unstorage](https://unstorage.unjs.io/) supports many K/V databases, including cloudflare KV, vercel KV, Azure, GitHub, nodeJS fs, MongoDB, Planetscale and redis.

```ts
const adapter: (unstorage: { session: Storage }) => () => SessionAdapter;
```

### Parameter

| name              | type    | description                               |
| ----------------- | ------- | ----------------------------------------- |
| unstorage.session | Storage | client for Unstorage for storing sessions |

### Errors

The adapter and Lucia will not not handle [unknown errors](/basics/error-handling#known-errors), which are database errors Lucia doesn't expect the adapter to catch. When it encounters such errors, it will throw one of the Unstorage errors.

## Installation

```
npm i @lucia-auth/adapter-session-unstorage
pnpm add @lucia-auth/adapter-session-unstorage
yarn add @lucia-auth/adapter-session-unstorage
```

## Usage

You will need to set up a different adapter for storing users.

```ts
// lucia.ts
import lucia from "lucia-auth";
import Unstorage from "@lucia-auth/adapter-session-unstorage";
import prisma from "@lucia-auth/adapter-prisma";
import { createStorage } from "unstorage";

const session = createStorage(/* options */);

export const auth = lucia({
	adapter: {
		user: prisma(), // any database adapter
		session: Unstorage({
			session,
			sessionKeyPrefix: "session", //optional, this is the default value
			userSessionKeyPrefix: "user_session" //optional, this is the default value
		})
	}
});
```

## Models

### `session`

| Key                                                    | Value                             |
| ------------------------------------------------------ | --------------------------------- |
| session id: `session:${session.id}`                    | SessionSchema : `SessionSchema[]` |
| user id: `user_session:${session.userId}:${timestamp}` | list of session ids: `string[]`   |
