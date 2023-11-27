---
title: "Mongoose adapter"
description: "Learn how to use Mongoose with Lucia"
---

Adapter for [Mongoose](https://github.com/Automattic/mongoose) provided by the Mongoose adapter package.

```ts
import { mongoose } from "@lucia-auth/adapter-mongoose";
```

```ts
const mongoose: (models: {
	User: Model;
	Session: Model | null;
	Key: Model;
}) => InitializeAdapter<Adapter>;
```

##### Parameters

Table names are automatically escaped.

| name             | type            | description                                                                                  |
| ---------------- | --------------- | -------------------------------------------------------------------------------------------- |
| `models.User`    | `Model`         | Mongoose model for user collection                                                           |
| `models.Key`     | `Model`         | Mongoose model for key collection                                                            |
| `models.Session` | `Model \| null` | Mongoose model for session collection - can be `null` when using alongside a session adapter |

## Installation

```
npm i @lucia-auth/adapter-mongoose
pnpm add @lucia-auth/adapter-mongoose
yarn add @lucia-auth/adapter-mongoose
```

## Usage

```ts
import { lucia } from "lucia";
import { mongoose } from "@lucia-auth/adapter-mongoose";
import mongodb from "mongoose";

// see next section for schema
const User = mongodb.model();
const Key = mongodb.model();
const Session = mongodb.model();

const auth = lucia({
	adapter: mongoose({
		User,
		Key,
		Session
	})
	// ...
});

// handle connection
mongodb.connect(mongoUri, options);
```

## Mongoose models

You can choose any model names.

### User collection

You can add additional fields to store user attributes.

```ts
import mongodb from "mongoose";

const User = mongodb.model(
	"User",
	new mongodb.Schema(
		{
			_id: {
				type: String,
				required: true
			}
		} as const,
		{ _id: false }
	)
);
```

### Key collection

```ts
import mongodb from "mongoose";

const Key = mongodb.model(
	"Key",
	new mongodb.Schema(
		{
			_id: {
				type: String,
				required: true
			},
			user_id: {
				type: String,
				required: true
			},
			hashed_password: String
		} as const,
		{ _id: false }
	)
);
```

### Session collection

You can add additional fields to store session attributes.

```ts
import mongodb from "mongoose";

const Session = mongodb.model(
	"Session",
	new mongodb.Schema(
		{
			_id: {
				type: String,
				required: true
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
		} as const,
		{ _id: false }
	)
);
```
