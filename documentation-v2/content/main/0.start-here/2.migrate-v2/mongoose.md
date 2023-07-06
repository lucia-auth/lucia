---
order: 0
title: "Update your Mongoose client to Lucia v2"
---

Install the latest beta of the Mongoose adapter.

```
npm i @lucia-auth/adapter-mongoose@beta
pnpm add @lucia-auth/adapter-mongoose@beta
yarn add @lucia-auth/adapter-mongoose@beta
```

## Remove single use keys

```ts
// db.<collection_name>
db.authKey.deleteMany({
	expires: { $ne: null }
});
```

## Update `Key` model

Remove `expires` and `primary_key` fields.

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
			hashed_password: String
		},
		{ _id: false }
	)
);
```

## Initialize adapter

`mongoose()` is now a named export instead of a default export. The adapter now takes models for users, keys, and session, instead of the Mongoose client.

```ts
import { lucia } from "lucia";
import { mongoose } from "@lucia-auth/adapter-mongoose";
import mongodb from "mongoose";

const User = mongoose.model();
const Key = mongoose.model();
const Session = mongoose.model();

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
