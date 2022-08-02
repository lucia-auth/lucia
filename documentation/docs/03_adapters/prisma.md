## Overview

An adapter to use with Prisma (for SQL databases).

### Installation

```bash
npm i @lucia-sveltekit/adapter-prisma
```

## Usage

```ts
import prisma from "@lucia-sveltekit/adapter-prisma";
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

## Schemas

The following is for MySQL. `@db.VarChar(300)` should be the language's equivalent if you're using another language (refer to [this](https://www.prisma.io/docs/reference/api-reference/prisma-schema-reference#string) page). Note that the table names are `user` and `refresh_token`.

### users

`[user_data]` represents any number of additional columns that may be used.

```http
model User {
  id               String           @id @unique
  identifier_token String           @unique
  hashed_password  String?
  [user_data]      any?
  RefreshToken     RefreshToken[]
  @@map("user")
}
```

### refresh_token

```http
model RefreshToken {
  id            Int    @id @unique @default(autoincrement())
  refresh_token String @unique @db.VarChar(300)
  user          User  @relation(references: [id], fields: [user_id], onDelete: Cascade)
  user_id       String

  @@index([user_id])
  @@map("refresh_token)
}
```

`User` may have additional columns (which are represented by `[user_data]`).

## Types

The following automatically add types to Lucia and the session object from Prisma.

```ts
import type { User } from "@prisma/client";

const auth = lucia<Omit<User, "id" | "identifier_token" | "hashed_password">>();
```

```ts
import type { User } from "@prisma/client";

declare namespace App {
    interface Session {
        lucia:
            | import("lucia-sveltekit/types").SvelteKitSession<
                  Omit<User, "id" | "identifier_token" | "hashed_password">
              >
            | null;
    }
}
```

## Issues

-   When using PlanetScale, Lucia (or rather Prisma/Planetscale) will ignore the foreign key constraint on `Refresh_Token.user_id` (issues [#8](https://github.com/pilcrowOnPaper/lucia-sveltekit/issues/8))
-   When using PlanetScale, errors usually handled as `AUTH_DUPLICATE_IDENTIFIER_TOKEN` will be returned as `AUTH_DUPLICATE_USER_DATA`
