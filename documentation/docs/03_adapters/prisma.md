## Overview

An adapter to use with Prisma (for SQL databases).

```ts
import prisma from "@lucia-sveltekit/adapter-supabase";
import { PrismaClient } from "@prisma/client";

const client = new PrismaClient();

const auth = lucia({
    adapter: prisma(client),
    // ...
});
```

#### Parameters

| name   | type         | description          |
| ------ | ------------ | -------------------- |
| client | PrismaClient | `new PrismaClient()` |

## Schema

The following is for MySQL. `@db.VarChar(300)` should be the language's equivalent if you're using another language (refer to [this](https://www.prisma.io/docs/reference/api-reference/prisma-schema-reference#string) page).

```http
model Users {
  id               String           @id @unique
  identifier_token String           @unique
  hashed_password  String?
  Refresh_Tokens   Refresh_Tokens[]
}

model Refresh_Tokens {
  id            Int    @id @unique @default(autoincrement())
  refresh_token String @unique @db.VarChar(300)
  user          Users  @relation(references: [id], fields: [user_id], onDelete: Cascade)
  user_id       String

  @@index([user_id])
}
```

`Users` may have additional columns.

## Types

The following automatically add types to Lucia and the session object from Prisma. 

```ts
import type { Users } from "@prisma/client";

const auth =
    lucia<Omit<Users, "id" | "identifier_token" | "hashed_password">>();
```

```ts
import type { Users } from "@prisma/client";

declare namespace App {
    interface Session {
        lucia:
            | import("lucia-sveltekit/types").SvelteKitSession<
                  Omit<Users, "id" | "identifier_token" | "hashed_password">
              >
            | null;
    }
}
```

## Issues

-   When using PlanetScale, Lucia (or rather Prisma/Planetscale) will ignore the foreign key constraint on `Refresh_Token.user_id` (issues [#8](https://github.com/pilcrowOnPaper/lucia-sveltekit/issues/8))
-   When using PlanetScale, errors usually handled as `AUTH_DUPLICATE_IDENTIFIER_TOKEN` will be returned as `AUTH_DUPLICATE_USER_DATA`
