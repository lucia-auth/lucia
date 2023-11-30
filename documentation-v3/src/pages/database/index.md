---
layout: "@layouts/DocLayout.astro"
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

- [Drizzle ORM](/database/drizzle)
- [MongoDB](/database/mongodb)
- [Mongoose](/database/mongoose)
- [MySQL](/database/mysql)
  - [`mysql2`](/database/mysql#mysql2)
  - [PlanetScale serverless](/database/mysql#planetscale-serverless)
- [PostgreSQL](/database/postgresql)
  - [node-postgres](/database/postgresql#node-postgres) (`pg`)
  - [Postgres.js](/database/postgresql#postgres-js) (`postgres`)
- [Prisma](/database/prisma)
- [SQLite](/database/sqlite)
  - [`better-sqlite3`](/database/sqlite#better-sqlite3)
  - [Bun SQLite](/database/sqlite#bun-sqlite) (`bun:sqlite`)
  - [Cloudflare D1](/database/sqlite#cloudflare-d1)
  - [LibSQL](/database/sqlite#libsql) (Turso)
