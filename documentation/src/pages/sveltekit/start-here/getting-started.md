---
order: 0
layout: "@layouts/DocumentLayout.astro"
title: "Getting started"
---

Install Lucia and the SvelteKit integration using your package manager of your choice. `lucia-auth` can be used as is in a server environment (and only inside it), and `@lucia-auth/sveltekit` provides SvelteKit specific code for both the backend and frontend.

```bash
npm i lucia-auth @lucia-auth/sveltekit
pnpm add lucia-auth @lucia-auth/sveltekit
yarn add lucia-auth @lucia-auth/sveltekit
```

## Set up the database

Following the guide in one of the adapters provided by Lucia, set up the database and install the adapter (adapters are provided as a different NPM package).

## Initialize Lucia

In `$lib/server/lucia.ts`, import [`lucia`](/reference/api/server-api#lucia) from `lucia-auth`. Initialize it by calling `lucia()` and export it as `auth` as usual. `adapter` is your database adapters, and [`env`](/reference/configure/lucia-configurations#env) tells Lucia what environment the server is running on. Checking if [`dev`](https://kit.svelte.dev/docs/modules#$app-environment-dev) (imported from `$app/environment`) is true is usually sufficient. Export the type of `auth` as well.

```ts
// lib/server/lucia.ts
import lucia from "lucia-auth";
import prisma from "@lucia-auth/adapter-prisma";
import { dev } from "$app/environment";

export const auth = lucia({
	adapter: prisma(prismaClient),
	env: dev ? "DEV" : "PROD"
});

export type Auth = typeof auth;
```

This module and the file that holds it **should NOT be imported from the client**.

## Configure your SvelteKit project

SvelteKit specific functions are imported from `@lucia-auth/sveltekit`.

### Hooks

Create a server hooks file (`src/hooks.server.ts`) and import the `auth` module. Create and export a handle function with [`handleHooks()`](/reference/api/server-api#handlehooks). This will read and validate the session of incoming requests (including page render). This will also automatically renew idle sessions.

```ts
// src/hooks.server.ts
import { auth } from "$lib/server/lucia";
import { handleHooks } from "@lucia-auth/sveltekit";
import type { Handle } from "@sveltejs/kit";

export const handle: Handle = handleHooks(auth);
```

If you have your own handle function, SvelteKit's [`sequence`](https://kit.svelte.dev/docs/modules#sveltejs-kit-hooks-sequence) can be used to chain multiple handle functions. Make sure Lucia's handle function is the first one.

```ts
// src/hooks.server.ts
import { auth } from "$lib/server/lucia";
import { handleHooks } from "@lucia-auth/sveltekit";
import type { Handle } from "@sveltejs/kit";

export const handle: Handle = sequence(handleHooks(auth), customHandle);
```

### Root layout

In your route root, create `+layout.server.ts` and `+layout.svelte`.

#### Client

In `+layout.page`, import [`handleSession()`](/sveltekit/api-reference/client-api#handlesession) from `@lucia-auth/sveltekit`. This will listen for change in sessions and sync sessions across tab. This is required for other client side functions to work. Make sure not to subscribe to the `page` store passed on as the parameter.

```svelte
<script lang="ts">
	import { page } from '$app/stores';
	import { handleSession } from '@lucia-auth/sveltekit/client';

	handleSession(page);
</script>

<slot />
```

#### Server load functions

In `+layout.server.ts`, create and export [`handleServerSession()`](/reference/api/server-api#handleserversession). This will pass on the session data from hooks to load functions.

```ts
// routes/+layout.server.ts
import { auth } from "$lib/server/lucia";
import { handleServerSession } from "@lucia-auth/sveltekit";
import type { LayoutServerLoad } from "./$types.js";

export const load: LayoutServerLoad = handleServerSession(auth);
```

### Types

In `src/app.d.ts`, configure your types. The path in `import('$lib/server/lucia.js').Auth;` is where you exported `auth` (`lucia()`).

```ts
// src/app.d.ts
/// <reference types="lucia-auth" />
declare namespace Lucia {
	type Auth = import("$lib/server/lucia.js").Auth;
	type UserAttributes = {};
}

/// <reference types="@sveltejs/kit" />
declare namespace App {
	interface Locals {
		getSession: import("@lucia-auth/sveltekit").GetSession;
		setSession: import("@lucia-auth/sveltekit").SetSession;
		clearSession: import("@lucia-auth/sveltekit").ClearSession;
	}
}
```
