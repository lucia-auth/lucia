---
title: "Prisma"
---

# Prisma

The `@lucia-auth/adapter-prisma` package provides adapters for Prisma.

```
npm install @lucia-auth/adapter-prisma
```

## Schema

The data field names and types must exactly match the ones in the schema below. While you can change the model names, the relation name in the session model (`Session.user`) must be the camel-case version of the user model name. For example, if the user model was named `AuthUser`, the relation must be named `Session.authUser`.

User ID can be numeric (see [Define user ID type](/basics/users#define-user-id-type)) but session ID must be a string type.

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
import { PrismaAdapter } from "@lucia-auth/adapter-prisma";
import { PrismaClient } from "@prisma/client";

const client = new PrismaClient();

const adapter = new PrismaAdapter(client.session, client.user);
```
