---
title: "Using Lucia with Cloudflare Workers on Hono"
description: "Learn how to use Lucia within Cloudflare Workers using Hono, Drizzle ORM and D1."
---

[Cloudflare Workers](https://workers.cloudflare.com/) is a serverless platform that allows you to run code on Cloudflare's edge network, reducing latency for your users. If you are new to Cloudflare Workers, you can learn more about them in the [Cloudflare Workers documentation](https://developers.cloudflare.com/workers/get-started/guide/).

Lucia offers middleware for [Hono](https://hono.dev/), a framework which supports Cloudflare Workers. This guide will walk you through using Lucia with Cloudflare Workers on Hono. Using [Drizzle ORM](https://orm.drizzle.team/) and [Cloudflare D1](https://developers.cloudflare.com/d1/) as our database driver.

## Hashing Considerations

Please note that hashing will not work on Free Bundled Workers; **the allocated 10ms CPU time is not sufficient for this**. Consider using unbound workers or paid bundled workers for hashing operations.

## Getting Started

Create a simple application with Hono:

```ts
npm create hono@latest my-app
```

If you don't have Wrangler installed, you can install it globally with `npm install -g wrangler`, or add it as a dev dependency to your project with `npm install -D wrangler`.

Install Lucia and the database adapter for your chosen database (in this case, SQLite as we're using D1):

```ts
npm install lucia && npm install @lucia-auth/adapter-sqlite
```

## Using Prisma on The Edge

If you are using [`adapter-prisma`](/database-adapters/prisma) within your worker, you'll have to import `PrismaClient` from `@prisma/client/edge` instead of `@prisma/client`.

## Drizzle Schema

Create your drizzle schema in a `schema.ts` file in your worker:

```ts
import { tableNames } from "./db.ts";
import {
    sqliteTable,
    text,
    integer,
    uniqueIndex,
} from "drizzle-orm/sqlite-core"

export const user = sqliteTable("user", {
    id: text("id").primaryKey()
});

export const session = sqliteTable("user_session", {
    id: text("id").primaryKey(),
    userId: text("user_id")
        .notNull()
        .references(() => users.id, {
            onUpdate: "cascade",
            onDelete: "cascade",    
    }),
    activeExpires: integer("active_expires").notNull(),
    idleExpires: integer("idle_expires").notNull(),
});

export const key = sqliteTable("user_key", {
    id: text("id").primaryKey(),
    userId: text("user_id")
        .notNull()
        .references(() => user.id),
    hashedPassword: text("hashed_password")
});
```

## Drizzle and D1 Wrapper

Create a `db.ts` file in your worker containing the following; modify it as needed to suit your specific database setup.
This creates a wrapper for both Drizzle ORM and D1 itself, allowing you to use both when required.

You can initialize a local D1 database for testing with `wrangler d1 execute --local --file=./path/to/schema.sql`.
To start the worker locally, run `[npx] wrangler dev --local --persist`.

```ts
import { drizzle as DrizzleORM } from "drizzle-orm/d1";
import { createClient } from "@libsql/client/web"
import { schema } from "./schema.ts";

export const tableNames = {
    user: "authUser",
    session: "authSession",
    key: "authKey",
    // ...
};

export const dbClient = (env: Env) => {
    const D1Database = env.database;

    const drizzle = DrizzleORM(database, {
        schema,
        // ...
    });

    return {
        D1Database,
        drizzle,
    };
};
```

Set your binding to your D1 database in your `wrangler.toml` file, to get types for D1, install `@cloudflare/workers-types`.

```toml
[[ d1_databases ]]
binding = "database"
database_name = "database_name"
database_id = "database_id"
```

## Lucia Configuration

Create a `lucia.ts` file in your project with the following content. This sets up Lucia with the correct adapter and Hono middleware:
Remember to pass env when calling the auth function in your worker, as it must be initialized with each request.

```ts
import { lucia } from "lucia";
import { hono } from "lucia/middleware";
import { d1 } from "@lucia-auth/adapter-sqlite";
import { tableNames, dbClient } from "./db.ts";

export const auth = (env: Env) => {
    const db = dbClient(env).D1Database;

    return lucia({
        adapter: d1(db, tableNames),
        middleware: hono()
        // ...
    });
}


export type Auth = typeof auth;
```

## Routes in Hono

Within your hono routes, you're able to call lucia like so, with your bindings typed:

You can follow the [Sign in With Username and Password](/guidebook/sign-in-with-username-and-password#hono) guide for Hono, modify it to pass `c.env` to the `auth` function.

```ts
import { Hono } from 'hono'
import { auth } from './lucia.ts'
import { D1Database } from "@cloudflare/workers-types";

type Bindings = {    
    database: D1Database
}

const app = new Hono<{ Bindings: Bindings }>()

app.get('/', (c) => {
    c.status(200)
    return c.json({ message: 'This route is a public route!' })
})

app.get('/private', (c) => {
    const session = auth(c.env).handleRequest(c).validate()

    if (!session) {
        c.status(401)
        return c.json({ message: 'You are not logged in!' })
    }

    c.status(200)
    return c.json({ message: 'You are logged in and then view this route!', session })
})
```

## Session Attributes

If you want to add session attributes for additional security based off the [Improving Session Security](/guidebook/improve-session-security) guide, such as Country, User Agent or IP, you can fetch the `cf-ipcountry` header for IP, `user-agent` for User Agent, `x-forwarded-for` or `x-real-ip` for IP. Hashing is strongly reccomended to further prevent session hijacking and user security.

```ts
const newSession = await auth(c.env).createSession({
    // ...
    attributes: {
        userAgent: c.request.headers.get("user-agent") ?? null,
        country: c.request.headers.get("cf-ipcountry") ?? null,
        ip: c.request.headers.get("x-forwarded-for") || c.request.headers.get("x-real-ip") ?? null,
    },
});
```

## Deploying

To deploy your worker, you can use the [Wrangler CLI](https://developers.cloudflare.com/workers/cli-wrangler).

```bash
wrangler publish
```

You can utilize this worker either as a Backend API for a frontend application or as a standalone API, depending on your configuration, utilizing bearer tokens or cookies for authentication.
