---
order: 0
layout: "@layouts/DocumentLayout.astro"
title: "Mongoose (MongoDB)"
---

An adapter for Mongoose (MongoDB).

```ts
const adapter: (mongoose: Mongoose) => Adapter;
```

**This adapter does NOT support auto user id generation.** Please generate your own user id using Lucia's `generateUserId()` in the configurations or use Mongoose's default field value. In either cases, the returned value **MUST** be a string (not `ObjectId`).

This adapter will not handle database connection and you will need to connect to the database manually.

### Parameter

| name     | type       | description     |
| -------- | ---------- | --------------- |
| mongoose | `Mongoose` | Mongoose client |

## Installation

```bash
npm i @lucia-sveltekit/adapter-mongoose
pnpm add @lucia-sveltekit/adapter-mongoose
yarn add @lucia-sveltekit/adapter-mongoose
```

## Usage

```ts
import adapter from "@lucia-sveltekit/adapter-prisma";
import mongoose from "mongoose";

// set model here

const auth = lucia({
    adapter: adapter(mongoose),
});
```

You'll need to connect to the database inside hooks as well:

```ts
// hooks.server.ts
import mongoose from "mongoose";
import { auth } from "$lib/auth/lucia";

mongoose.connect(mongoUri, options);

export const handle = auth.handleHooks();
```

## Models

### `user`

You may add additional fields to store user attributes. Refer to [Store user attributes](/learn/basics/store-user-attributes).

```ts
const User = mongoose.model(
    "user",
    new mongoose.Schema(
        {
            _id: {
                type: String,
            },
            provider_id: {
                type: String,
                unique: true,
                required: true,
            },
            hashed_password: String,
        },
        { _id: false }
    )
);
```

### `session`

You do not need this if you're using the adapter for [`adapter.user`](/reference/configure/lucia-configurations#adapter) config.

```ts
const Session = mongoose.model(
    "session",
    new mongoose.Schema(
        {
            _id: {
                type: String,
            },
            user_id: {
                type: String,
                required: true,
            },
            expires: {
                type: Number,
                required: true,
            },
            idle_expires: {
                type: Number,
                required: true,
            },
        },
        { _id: false }
    )
);
```
