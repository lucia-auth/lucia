---
title: "Prisma"
---

The `@lucia-auth/adapter-prisma` package provides adapters for Prisma.

```
npm install @lucia-auth/adapter-prisma
```

## Schema

```prisma
model User {
  id       String    @id @unique
  sessions Session[]
}

model Session {
  id        String   @id @unique
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

const lucia = new Lucia(new PrismaAdapter(client.session, client.user));
```