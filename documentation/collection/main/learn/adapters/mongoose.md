---
_order: 0
title: "Mongoose (MongoDB)"
---

An adapter for Mongoose (MongoDB).

```ts
const adapter: (mongoose: Mongoose) => AdapterFunction<Adapter>;
```

If you pass `null` as the user id, the adapter will generate a new `ObjectId` and use the stringified version (24-character hexadecimal string) as the user id.

This adapter will not handle database connection and you will need to connect to the database manually.

### Parameter

| name     | type       | description     | optional |
| -------- | ---------- | --------------- | -------- |
| mongoose | `Mongoose` | Mongoose client |          |

### Errors

The adapter and Lucia will not not handle [unknown errors](/learn/basics/error-handling#known-errors), which are database errors Lucia doesn't expect the adapter to catch. When it encounters such errors, it will throw a `MongooseError`.

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

// set models here like the User, Session, and Key models

const auth = lucia({
	// ,,,
	adapter: adapter(mongoose)
});
```

You'll need to handle the database connection as well.

```ts
// db.ts
// e.g. "src/hooks.server.ts" if you're using SvelteKit
import mongoose from "mongoose";

mongoose.connect(mongoUri, options);
```

## Models

### `user`

You may add additional fields to store user attributes. Refer to [User attributes](/learn/basics/user-attributes).

```ts
const User = mongoose.model(
	"user",
	new mongoose.Schema(
		{
			_id: {
				type: String
			}
			// here you can add custom fields for your user
			// e.g. name, email, username, roles, etc.
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
			active_expires: {
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

### `key`

```ts
const Key = mongoose.model(
	"key",
	new mongoose.Schema(
		{
			_id: {
				type: String
			},
			user_id: {
				type: String,
				required: true
			},
			hashed_password: String,
			primary: {
				type: Boolean,
				required: true
			},
			expires: Number
		},
		{ _id: false }
	)
);
```

> You can only add custom fields to the user model. The session and key models are managed by Lucia, so you can't add custom fields to them.
