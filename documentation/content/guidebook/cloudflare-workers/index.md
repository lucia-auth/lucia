---
title: "Using Lucia with Cloudflare Workers"
description: "Learn how to use Lucia within Cloudflare Workers using D1."
---

[Cloudflare Workers](https://workers.cloudflare.com/) is a serverless platform that allows you to run code on Cloudflare's edge network, reducing latency for your users. If you are new to Cloudflare Workers, you can learn more about them in the [Cloudflare Workers documentation](https://developers.cloudflare.com/workers/get-started/guide/).

This guide will walk you through using Lucia with Cloudflare Workers using the `web` middleware, [Cloudflare D1](https://developers.cloudflare.com/d1/) as our database driver and [itty-router](https://github.com/kwhitley/itty-router) as our router. A [Hono and Drizzle](/guidebook/cloudflare-workers/hono) guide is also available that utilizes D1.

## Hashing Considerations

Please note that hashing will not work on Free Bundled Workers; **the allocated 10ms CPU time is not sufficient for this**. Consider using unbound workers or paid bundled workers for hashing operations.

## Getting Started

Create a simple application with Cloudflare Workers:

```ts
npm create cloudflare@latest
```

If you don't have Wrangler installed, you can install it globally with `npm install -g wrangler`, or add it as a dev dependency to your project with `npm install -D wrangler`.

Install Lucia and the database adapter for your chosen database (in this case, SQLite as we're using D1):

```ts
npm install lucia && npm install @lucia-auth/adapter-sqlite
```

## Using Prisma on The Edge

If you are using [`adapter-prisma`](/database-adapters/prisma) within your worker instead of drizzle, you'll have to import `PrismaClient` from `@prisma/client/edge` instead of `@prisma/client`.

```ts
import { PrismaClient } from "@prisma/client/edge";
```

## D1 Schema

You can follow the Schema from [D1 Database Adapter Schema](/database-adapters/cloudflare-d1#sqlite3-schema):

```sql
-- schema.sql
CREATE TABLE user (
    id VARCHAR(15) NOT NULL PRIMARY KEY
    -- Add additional fields here
);

CREATE TABLE user_key (
    id VARCHAR(255) NOT NULL PRIMARY KEY,
    user_id VARCHAR(15) NOT NULL,
    hashed_password VARCHAR(255),
    FOREIGN KEY (user_id) REFERENCES user(id)
);

CREATE TABLE user_session (
    id VARCHAR(127) NOT NULL PRIMARY KEY,
    user_id VARCHAR(15) NOT NULL,
    active_expires BIGINT NOT NULL,
    idle_expires BIGINT NOT NULL,
    FOREIGN KEY (user_id) REFERENCES user(id)
);
```

Set your binding to your D1 database in your `wrangler.toml` file, to get types for D1, install `@cloudflare/workers-types`.

```toml
[[ d1_databases ]]
binding = "database"
database_name = "database_name"
database_id = "database_id"
```

You can initialize a local D1 database for testing with `wrangler d1 execute --local --file=./path/to/schema.sql`.
To start the worker locally, run `[npx] wrangler dev --local --persist`.

You can follow the [Sign in with Username and Password](/guidebook/sign-in-with-username-and-password) guide, with the following changes suitable for Cloudflare Workers & itty-router:

In your `lucia.ts`, we pass in env as as a parameter to our `auth` function, as this has to be initialized with each request:

```ts
// lucia.ts
import { lucia } from "lucia";
import { web } from "lucia/middleware";
import { d1 } from "@lucia-auth/adapter-sqlite";

export const auth = (env: Env) => lucia({
    adapter: d1(env.database, {
        user: "user",
        key: "user_key",
        session: "user_session"
    }),
    env: "DEV", // or PROD for production
    middleware: web(),
    sessionCookie: {
        expires: false
    }
});

export type Auth = typeof auth;
```

## Handling Routes with itty-router

Create your `index.ts`, this will be your entrypoint:

```ts
// index.ts
import { router } from "./handler";

export default {
    fetch: router.handle,
};
```

Then, `handler.ts`, this will handle your routes:

```ts
// handler.ts
import { Router } from "itty-router";
// import seperate routes here..

const router = Router();

router.get("/", () => new Response("Hello World!"));
router.all("*", (): Response => {
    return new Response(JSON.stringify({ message: "Not Found" }));
});

export { router }
```

You can export your own functions from seperate files and import them into `handler.ts` to keep your code clean, where you can then use `router.get("/route", yourFunction)` to handle your routes.

## Creating Authorized Routes

```ts
// ./routes/authorized-route.ts
import { auth } from "./lucia.ts";

export const authorizedRoute = async (
    request: Request,
    env: Env
): Promise<Response> => {
    const session = auth(env).handleRequest(request).validate();

    if (!session) {
        return new Response(JSON.stringify({ message: "Unauthorized" }), {
            status: 401,
        });
    }

    return new Response(JSON.stringify({ message: "Authorized", session }), {
        status: 200,
    });
};
```

## Session Attributes

If you want to add session attributes for additional security based off the [Improving Session Security](/guidebook/improve-session-security) guide, such as Country, User Agent or IP, you can fetch the `cf-ipcountry` header for IP, `user-agent` for User Agent, `x-forwarded-for` or `x-real-ip` for IP. Hashing is strongly reccomended to further prevent session hijacking and user security.

## Deploying

To deploy your worker, you can use the [Wrangler CLI](https://developers.cloudflare.com/workers/cli-wrangler).

```bash
wrangler publish
```
