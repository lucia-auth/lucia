---
layout: "@layouts/DocLayout.astro"
title: "Getting started"
---

A framework-specific guide is also available for:

- [Astro]()
- [Elysia]()
- [Express]()
- [Hono]()
- [Next.js App router]()
- [Next.js Pages router]()
- [Node.js]()
- [Nuxt]()
- [SvelteKit]()

## Installation

Install Lucia using your package manager of your choice. While not strictly necessary, we recommend installing [`oslo`](), which Lucia is built on, for various auth utilities (which this docs use).

```
npm install lucia oslo
pnpm add lucia oslo
yarn add lucia oslo
```

## Setup your database

Lucia provides various database adapters. See these guides on various drivers, ORMs, and 

- [Drizzle ORM]()
- [MongoDB]()
- [Mongoose]()
- [MySQL]()
    - [`mysql2`]()
    - [PlanetScale serverless]()
- [PostgreSQL]()
    - [node-postgres]()
    - [Postgres.js]()
- [Prisma]()
- [SQLite]()
    - [`better-sqlite3`]()
    - [Bun SQLite]() (`bun:sqlite`)
    - [Cloudflare D1]()
    - [LibSQL]() (Turso)

## Initialize Lucia

Import `Lucia` and initialize it with your adapter. Make sure to configure your cookies and register your `Lucia` instance type. 

```ts
import { Lucia } from "lucia";
import { BetterSQLite3Adapter } from "@lucia-auth/adapter-sqlite"; // your adapter

const adapter = new BetterSQLite3Adapter(db);

export const auth = new Lucia(adapter, {
	sessionCookie: {
		attributes: {
            // IMPORTANT!
			secure: PRODUCTION === true // `true` when deploying to HTTPS (production)
		}
	}
});

 // IMPORTANT!
declare module "lucia" {
	interface Register {
		Lucia: typeof auth;
	}
}
```

## Polyfill

If you're using Node.js 18 or below, you'll need to polyfill the Web Crypto API. This is not required in Node.js 20, CouldFlare Workers, Deno, Bun, and Vercel Edge Functions. This can be done either by importing `webcrypto`, or by enabling an experimental flag.

```ts
import { webcrypto } from "node:crypto";

globalThis.crypto = webcrypto as Crypto;
```

```
node --experimental-web-crypto index.js
```
