---
title: "MongoDB"
---

# MongoDB

The `@lucia-auth/adapter-mongodb` package provides adapters for MongoDB.

```
npm install @lucia-auth/adapter-mongodb
```

## Usage

You must handle the database connection manually.

User ID can be numeric or object ID (see [Define user ID type](/basics/users#define-user-id-type)) but session ID must be a string type.

```ts
import { Lucia } from "lucia";
import { MongodbAdapter } from "@lucia-auth/adapter-mongodb";
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

interface SessionDoc {
	_id: string;
	expires_at: Date;
	user_id: string;
}
```
