---
order: 1
layout: "@layouts/DocumentLayout.astro"
title: "Getting started"
---

Install Lucia using your package manager of your choice.

```bash
npm i lucia-sveltekit
pnpm i lucia-sveltekit
yarn add lucia-sveltekit
```

## Set up the database

Lucia currently supports multiple databases: [Prisma](/learn/adapters/prisma) (SQL, MySQL, SQLite, PostgreSQL), [Supabase](/learn/adapters/supabase), [Mongoose](/learn/adapters/mongoose) (MongoDB), and [CouchDB](/learn/adapters/couchdb). Please follow each adapter's instruction for this step.

## Initialize Lucia

In `$lib/server/lucia.ts`, import `lucia` from the lucia module and an adapter (the adapters are provided as a different npm package).

```ts
// lib/server/lucia.ts
import lucia from "lucia-sveltekit";
import prisma from "@lucia-sveltekit/adapter-prisma";
```

Initialize it by calling `lucia()` and export it as `auth`. The `secret` should be something long and random, and `env` tells Lucia what environment the server is running in. Checking if `dev` is true is usually sufficient.

```ts
// lib/server/lucia.ts
import lucia from "lucia-sveltekit";
import prisma from "@lucia-sveltekit/adapter-prisma";
import { dev } from "$app/environment";

export const auth = lucia({
    adapter: prisma(),
    secret: "aWmJoT0gOdjh2-Zc2Zv3BTErb29qQNWEunlj",
    env: dev ? "DEV" : "PROD",
});
```

This module and the file that holds it **should NOT be imported from the client**.

## Configure your SvelteKit project

### Hooks

Create a server hooks file (`src/hooks.server.ts`) and import the `auth` module. Create and export a handle function with `handleHooks()` method. This will handle token refresh and sign out requests, as well as exposing the user's data to the client.

```ts
// hooks.server.ts
import { auth } from "$lib/server/lucia";

export const handle = auth.handleHooks();
```

If you have your own handle function, SvelteKit's `sequence` can be used to chain multiple handle functions. Make sure Lucia's handle function is the first one.

```ts
// hooks.server.ts
import { auth } from "$lib/server/lucia";
import { sequence } from "@sveltejs/kit";

export const handle = sequence(auth.handleHooks(), customHandle);
```

### Root layout

In your route root layout, create and export a server load function. `handleServerSession()` method will read the token and validate them, allowing you to check for the user in load functions. This will also automatically refresh the access token if its expired.

```ts
// +layout.server.ts
import { auth } from "$lib/server/lucia";
import type { ServerLoad } from "@sveltejs/kit"

export const load: ServerLoad = auth.handleServerSession()
```
