---
layout: "@layouts/DocLayout.astro"
title: "Mongoose"
---

You can use the [MongoDB adapter]() from the `@lucia-auth/adapter-mongodb` package with Mongoose.

```
npm install @lucia-auth/adapter-mongodb@beta
```

## Usage

You must handle the database connection manually.

```ts
import { Lucia } from "lucia";
import { MongoDBAdapter } from "@lucia-auth/adapter-mongodb";
import mongoose from "mongoose";

await mongoose.connect();

const User = mongoose.model(
	"User",
	new mongoose.Schema(
		{
			_id: {
				type: String,
				required: true
			}
		} as const,
		{ _id: false }
	)
);

const Session = mongoose.model(
	"Session",
	new mongoose.Schema(
		{
			_id: {
				type: String,
				required: true
			},
			user_id: {
				type: String,
				required: true
			},
			expires_at: {
				type: Date,
				required: true
			},
		} as const,
		{ _id: false }
	)
);

const auth = new Lucia(new MongodbAdapter(
	mongoose.connection.collection("sessions"),
	mongoose.connection.collection("users")
););
```
