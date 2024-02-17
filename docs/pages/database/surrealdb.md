---
title: "SurrealDB"
---

# SurrealDB

The `@lucia-auth/adapter-surreal` package provides adapters for SurrealDB.

```
npm install @lucia-auth/adapter-surreal
```

## Usage

```ts
import { Lucia } from "lucia";
import { SurrealAdapter } from "@lucia-auth/adapter-surreal";
import { Surreal } from "surrealdb.js";

const db = new Surreal();
await db.connect('ws://localhost:8000');

db.signin({
  username: 'root', 
  password: 'root',
  namespace: "test",
  database: "test"
});

const adapter = new SurrealAdapter({
  db,
  // Users table name
  user_tb: "user",
  // Sessions table name
  session_tb: "session"
});
```
