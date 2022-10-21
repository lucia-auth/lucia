---
order: 2
layout: "@layouts/DocumentLayout.astro"
title: "Getting started"
---

Install Lucia using your package manager of your choice.

```bash
npm i lucia-sveltekit
pnpm add lucia-sveltekit
yarn add lucia-sveltekit
```

## Set up the database

Lucia currently supports multiple databases: [Prisma](/learn/adapters/prisma) (SQL, MySQL, SQLite, PostgreSQL), [Supabase](/learn/adapters/supabase), and [Mongoose](/learn/adapters/mongoose) (MongoDB). Please follow each adapter's instruction for this step.

You can also use a different database for storing sessions, such as [Redis](/learn/session-adapters/redis). Refer to [`configs.adapter`](/reference/configure/lucia-configurations#adapter).

## Initialize Lucia

In `$lib/server/lucia.ts`, import [`lucia`](/reference/api/server-api#lucia) and an adapter (the adapters are provided as a different NPM package).

```ts
// lib/server/lucia.ts
import lucia from "lucia-sveltekit";
import prisma from "@lucia-sveltekit/adapter-prisma";
```

Initialize it by calling `lucia()` and export it as `auth`. `adapter` is your database adapters, and [`env`](/reference/configure/lucia-configurations#env) tells Lucia what environment the server is running on. Checking if [`dev`](https://kit.svelte.dev/docs/modules#$app-environment-dev) (imported from `$app/environment`) is true is usually sufficient. Export the type of `auth` as well.

```ts
// lib/server/lucia.ts
import lucia from "lucia-sveltekit";
import prisma from "@lucia-sveltekit/adapter-prisma";
import { dev } from "$app/environment";

export const auth = lucia({
    adapter: prisma(),
    env: dev ? "DEV" : "PROD",
});

export type Auth = typeof auth;
```

This module and the file that holds it **should NOT be imported from the client**.

## Configure your SvelteKit project

### Hooks

Create a server hooks file (`src/hooks.server.ts`) and import the `auth` module. Create and export a handle function with [`handleHooks()`](/reference/api/server-api#handlehooks) method. This will read and validate the session of incoming requests (including page render). This will also automatically renew idle sessions.

```ts
// hooks.server.ts
import { auth } from "$lib/server/lucia";

export const handle = auth.handleHooks();
```

If you have your own handle function, SvelteKit's [`sequence`](https://kit.svelte.dev/docs/modules#sveltejs-kit-hooks-sequence) can be used to chain multiple handle functions. Make sure Lucia's handle function is the first one.

```ts
// hooks.server.ts
import { auth } from "$lib/server/lucia";
import { sequence } from "@sveltejs/kit/hooks";

export const handle = sequence(auth.handleHooks(), customHandle);
```

### Root layout

In your route root layout, create and export a server load function. [`handleServerSession()`](/reference/api/server-api#handleserversession) method will pass on the session data from hooks to load functions.

```ts
// +layout.server.ts
import { auth } from "$lib/server/lucia";
import type { LayoutServerLoad } from "@sveltejs/kit";

export const load: LayoutServerLoad = auth.handleServerSession();
```

To learn how Lucia can be used in a SvelteKit project, continue to [Quick start](/learn/start-here/quick-start). Or, if you want to dive straight in, start reading [Create users](/learn/basics/create-users).

### Types

In `src/app.d.ts`, configure your types. The path in `import('$lib/server/lucia.js').Auth;` is where you exported `auth` (`lucia()`).

```ts
/// <reference types="lucia-sveltekit" />
declare namespace Lucia {
    type Auth = import("$lib/server/lucia.js").Auth;
    type UserAttributes = {};
}

/// <reference types="@sveltejs/kit" />
declare namespace App {
    interface Locals {
        getSession: import("lucia-sveltekit/types").GetSession;
        setSession: import("lucia-sveltekit/types").SetSession;
        clearSession: import("lucia-sveltekit/types").ClearSession;
    }
}
```

(From the maintainer: If you know a way to add types to `App.Locals` without manually adding them, please let us know!)
