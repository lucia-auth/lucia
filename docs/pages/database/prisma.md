---
title: "Prisma"
---

# Prisma

The `@lucia-auth/adapter-prisma` package provides adapters for Prisma.

```
npm install @lucia-auth/adapter-prisma
```

## Schema

While Lucia does not enforce model names, the relation name (`user`) in the session model must be the camel-case version of the user model name. For example, if the user model was named `AuthUser`, the relation must be named `Session.authUser`.

```prisma
model User {
  id       String    @id
  sessions Session[]
}

model Session {
  id        String   @id
  userId    String
  expiresAt DateTime
  user      User     @relation(references: [id], fields: [userId], onDelete: Cascade)
}
```

## Usage

`PrismaAdapter` takes a session and user model.

```ts
import { Lucia } from "lucia";
import { PrismaAdapter } from "@lucia-auth/adapter-prisma";
import { PrismaClient } from "@prisma/client";

const client = new PrismaClient();

const adapter = new PrismaAdapter(client.session, client.user);
```
