---
title: "MongoDB"
---

The `@lucia-auth/adapter-mongodb` package provides adapters for MongoDB.

```
npm install @lucia-auth/adapter-mongodb
```

## Usage

```ts
import { Lucia } from "lucia";
import { MongoDBAdapter } from "@lucia-auth/adapter-mongodb";
import { Collection, MongoClient } from "mongodb";

import type { UserDoc, SessionDoc } from "@lucia-auth/adapter-mongodb";

const client = new MongoClient();
await client.connect();
const db = client.db();

const User = db.collection("users") as Collection<UserDoc>;
const Session = db.collection("sessions") as Collection<SessionDoc>;

const auth = new Lucia(new MongodbAdapter(Session, User));
```
