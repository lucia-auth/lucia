---
order: 0
layout: "@layouts/DocumentLayout.astro"
title: "Mongoose (MongoDB)"
---

An adapter for Mongoose (MongoDB).

```ts
const adapter: (mongoose: Mongoose, handleError?: (error: MongooseError) => void) => Adapter;
```

**This adapter does NOT support auto user id generation.** Please generate your own user id using Lucia's [`generateUserId()`](/reference/configure/lucia-configurations#generatecustomuserid) in the configurations or use Mongoose's default field value. In either cases, the returned value **MUST** be a string (not `ObjectId`).

This adapter will not handle database connection and you will need to connect to the database manually.

### Parameter

`handleError()` may be provided which will be called on [unknown errors](/learn/basics/error-handling#known-errors) - database errors Lucia doesn't expect the adapter to catch. You can also throw custom errors inside it, which will be thrown when an unknown database error occurs inside [`Lucia`](/reference/api/server-api#lucia-default) methods.

| name        | type       | description     | optional |
| ----------- | ---------- | --------------- | -------- |
| mongoose    | `Mongoose` | Mongoose client |          |
| handleError | `Function` |                 | true     |

### Errors

When an adapter encounters an unknown error (described above), it will throw `MongooseError`.

## Installation

```bash
npm i @lucia-auth/adapter-mongoose
pnpm add @lucia-auth/adapter-mongoose
yarn add @lucia-auth/adapter-mongoose
```

## Usage

```ts
import adapter from "@lucia-auth/adapter-mongoose";
import mongoose from "mongoose";

// set model here

const auth = lucia({
	// ,,,
	adapter: adapter(mongoose)
});
```

You'll need to handle the database connection as well.

```ts
// db.ts
import mongoose from "mongoose";

mongoose.connect(mongoUri, options);
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
				type: String
			},
			provider_id: {
				type: String,
				unique: true,
				required: true
			},
			hashed_password: String
		},
		{ _id: false }
	)
);
```

### `session`

This is not required if you're only using the Mongoose adapter for the `user` table via [`adapter.user`](/reference/configure/lucia-configurations#adapter) config.

```ts
const Session = mongoose.model(
	"session",
	new mongoose.Schema(
		{
			_id: {
				type: String
			},
			user_id: {
				type: String,
				required: true
			},
			expires: {
				type: Number,
				required: true
			},
			idle_expires: {
				type: Number,
				required: true
			}
		},
		{ _id: false }
	)
);
```
