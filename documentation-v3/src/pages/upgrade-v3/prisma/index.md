---
layout: "@layouts/DocLayout.astro"
title: "Upgrade Prisma project to v3"
---

## Update the adapter

Install the latest version of the Prisma adapter.

```
npm install @lucia-auth/adapter-prisma@latest
```

Initialize the adapter:

```ts
import { PrismaClient } from "@prisma/client";
import { PrismaAdapter } from "@lucia-auth/adapter-prisma";

const client = new PrismaClient()

new PrismaAdapter(client.session, client.user);
```

## Update schema and database

- [MySQL]()
- [PostgreSQL]()
- [SQLite]()
