---
title: "Upgrade your Prisma project to v3"
---

# Upgrade your Prisma project to v3

## Update the adapter

Install the latest version of the Prisma adapter.

```
npm install @lucia-auth/adapter-prisma
```

Initialize the adapter:

```ts
import { PrismaClient } from "@prisma/client";
import { PrismaAdapter } from "@lucia-auth/adapter-prisma";

const client = new PrismaClient();

new PrismaAdapter(client.session, client.user);
```

## Update schema and database

- [MySQL](/upgrade-v3/prisma/mysql)
- [PostgreSQL](/upgrade-v3/prisma/postgresql)
- [SQLite](/upgrade-v3/prisma/sqlite)
