---
order: 0
title: "Update your Prisma client to Lucia v2"
---

Install the latest beta of the Prisma adapter.

```
npm i @lucia-auth/adapter-prisma@beta
pnpm add @lucia-auth/adapter-prisma@beta
yarn add @lucia-auth/adapter-prisma@beta
```

## Remove single use keys

### SQL

Same for SQLite, PostgreSQL, and MySQL.

```sql
DELETE FROM auth_key
WHERE expires != null;
```

### MongoDB

```ts
// db.<collection_name>
db.authKey.deleteMany({
	expires: { $ne: null }
});
```

## Update `AuthKey` model

Remove `Key(primary_key)` and `Key(expires)` from the schema.

```prisma
model AuthKey {
  id              String   @id @unique
  hashed_password String?
  user_id         String
  auth_user       AuthUser @relation(references: [id], fields: [user_id], onDelete: Cascade)

  @@index([user_id])
  @@map("auth_key")
}
```

## Initialize adapter

`prisma()` is now a named export instead of a default export.

```ts
import { lucia } from "lucia";
import { prisma } from "@lucia-auth/adapter-prisma";
import { PrismaClient } from "@prisma/client";

const client = new PrismaClient();

// default values
const auth = lucia({
	adapter: prisma(client, {
		modelNames: {
			user: "authUser",
			key: "authKey",
			session: "authSession"
		},
		userRelationKey: "auth_user"
	})
	// ...
});
```

You can now the models as well. Without the second `options` params, the adapter expects the [default schema](/database-adapters/prisma#prisma-schema), which is different from the one required in v1.
