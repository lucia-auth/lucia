---
title: "Mongoose"
---

# Mongoose

You can use the [MongoDB adapter](/database/mongodb) from the `@lucia-auth/adapter-mongodb` package with Mongoose.

```
npm install @lucia-auth/adapter-mongodb
```

## Usage

You must handle the database connection manually.

User ID can be numeric or object ID (see [Define user ID type](/basics/users#define-user-id-type)) but session ID must be a string type.

```ts
import { Lucia } from "lucia";
import { MongodbAdapter } from "@lucia-auth/adapter-mongodb";
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
			}
		} as const,
		{ _id: false }
	)
);

const adapter = new MongodbAdapter(
	mongoose.connection.collection("sessions"),
	mongoose.connection.collection("users")
);
```
