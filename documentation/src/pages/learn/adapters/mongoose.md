---
order: 1
layout: "@layouts/DocumentLayout.astro"
title: "Mongoose (MongoDB)"
---

An adapter for Mongoose (MongoDB).

```ts
const adapter: (mongoose: Mongoose, url: string) => Adapter;
```

**This adapter does NOT support auto user id generation.** Please generate your own user id using Lucia's `generateUserId()` in the configurations or use Mongoose's default field value. In either cases, the returned value **MUST** be a string (not `ObjectId`).

### Parameter

| name     | type       | description            |
| -------- | ---------- | ---------------------- |
| mongoose | `Mongoose` | Mongoose client        |
| url      | `string`   | MongoDB connection url |

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
    adapter: adapter(mongoose, url),
});
```

## Models

### `user`

You may add additional fields to store user attributes. Refer to [[Store user attributes](/learn/basics/store-user-attributes)

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
