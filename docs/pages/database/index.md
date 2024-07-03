---
title: "Database"
---

# Database

A database is required for storing your users and sessions. Lucia connects to your database via an adapter, which provides a set of basic, standardized querying methods that Lucia can use.

```ts
import { Lucia } from "lucia";
import { BetterSqlite3Adapter } from "@lucia-auth/adapter-sqlite";

const lucia = new Lucia(new BetterSqlite3Adapter(db));
```

See [`Adapter`](/reference/main/Adapter) for building your own adapters.

## Database setup

Refer to these guides on setting up your database, ORMs, and query builders:

-   [Drizzle ORM](/database/drizzle)
-   [Kysely](/database/kysely)
-   [MongoDB](/database/mongodb)
-   [Mongoose](/database/mongoose)
-   [MySQL](/database/mysql): `mysql2`, PlanetScale serverless
-   [PostgreSQL](/database/postgresql): Neon HTTP serverless driver, node-postgres (`pg`), Postgres.js (`postgres`)
-   [Prisma](/database/prisma)
-   [SQLite](/database/sqlite): `better-sqlite3`, Bun SQLite (`bun:sqlite`), Cloudflare D1, LibSQL (Turso)

## Community-maintained database adapters

These adapters are not routinely checked by the maintainers of Lucia. Make sure to check the source code and use them at your own risk!

-   [Astro DB adapter by Pilcrow](https://github.com/pilcrowOnPaper/lucia-adapter-astrodb)
-   [DynamoDB adapter by GNK Softworks](https://github.com/gnk-softworks/lucia-dynamodb-adapter)
-   [remult adapter by jycouet](https://github.com/jycouet/firstly/tree/main/packages/firstly/src/lib/auth)
