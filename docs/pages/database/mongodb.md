---
title: "MongoDB"
---

# MongoDB

The `@lucia-auth/adapter-mongodb` package provides adapters for MongoDB.

```
npm install @lucia-auth/adapter-mongodb@beta
```

## Usage

You must handle the database connection manually.

```ts
import { Lucia } from "lucia";
import { MongoDBAdapter } from "@lucia-auth/adapter-mongodb";
import { Collection, MongoClient } from "mongodb";

const client = new MongoClient();
await client.connect();

const db = client.db();
const User = db.collection("users") as Collection<UserDoc>;
const Session = db.collection("sessions") as Collection<SessionDoc>;

const adapter = new MongodbAdapter(Session, User);

interface UserDoc {
	_id: string;
}

interface Session {
	_id: string;
	expires_at: Date;
	user_id: string;
}
```
