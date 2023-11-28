---
layout: "@layouts/MainLayout.astro"
title: "Database"
---

A database is required for storing your users and sessions. Lucia connects to your database via an adapter, which provides a set of basic, standardized querying methods that Lucia can use.

```ts
import { Lucia } from "lucia";
import { BetterSqlite3Adapter } from "@lucia-auth/adapter-sqlite";

const auth = new Lucia(new BetterSqlite3Adapter(db));
```

See [`Adapter`]() for building your own adapters

## Database setup

Refer to these guides on setting up your database, ORMs, and query builders:

- [Drizzle ORM]()
- [MongoDB]()
- [Mongoose]()
- [MySQL]()
    - [`mysql2`]()
    - [PlanetScale serverless]()
- [PostgreSQL]()
    - [node-postgres]()
    - [Postgres.js]()
- [Prisma]()
- [SQLite]()
    - [`better-sqlite3`]()
    - [Bun SQLite]() (`bun:sqlite`)
    - [Cloudflare D1]()
    - [LibSQL]() (Turso)
