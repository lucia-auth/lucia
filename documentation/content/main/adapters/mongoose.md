---
_order: 0
title: "Mongoose"
description: "Learn how to use Mongoose with Lucia"
---

[Mongoose](https://github.com/Automattic/mongoose) is a MongoDB object modeling tool designed to work in an asynchronous environment

This adapter supports Mongoose version 6.x and 7.x.

```ts
const adapter: (mongoose: Mongoose) => () => Adapter;
```

This adapter will not handle database connections and it must be done manually.

> Version 2 of the adapter requires `lucia-auth` version 1.3.0 or greater

### Parameter

| name     | type       | description     |
| -------- | ---------- | --------------- |
| mongoose | `Mongoose` | Mongoose client |

### Errors

The adapter and Lucia will not not handle [unknown errors](/basics/error-handling#known-errors), which are database errors Lucia doesn't expect the adapter to catch. When it encounters such errors, it will throw a `MongooseError`.

## Installation

```
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

### `auth_user`

You may add additional fields to store user attributes. Refer to [User attributes](/basics/user-attributes).

```ts
const User = mongoose.model(
	"auth_user",
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

### `auth_session`

This is not required if you're only using the Mongoose adapter for the `user` table via [`adapter.user`](/basics/configuration#adapter) config.

```ts
const Session = mongoose.model(
	"auth_session",
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

### `auth_key`

```ts
const Key = mongoose.model(
	"auth_key",
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
			primary_key: {
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

### Custom collection names

You can defined the collection name of a model by defining `collection` when defining the schema:

```ts
const User = mongoose.model(
	"auth_user",
	new mongoose.Schema(
		{
			// ...
		},
		{
			// ...
			collection: "users"
		}
	)
);
```

The model name however cannot be changed.
