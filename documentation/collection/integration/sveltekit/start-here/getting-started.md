---
_order: 0
title: "Getting started"
---

Install Lucia and the SvelteKit integration using your package manager of your choice. `lucia-auth` can be used as is in a server environment (and only inside it), and `@lucia-auth/sveltekit` provides SvelteKit specific code for both the backend and frontend.

```bash
npm i lucia-auth @lucia-auth/sveltekit
pnpm add lucia-auth @lucia-auth/sveltekit
yarn add lucia-auth @lucia-auth/sveltekit
```

## Set up the database

Using the guide from the adapter docs, set up the database and install the adapter (adapters are provided as a different NPM package).

> (warn) Anything inside the `user` database will be sent to the client. While this is fine for most situations, make sure you aren't storing any sensitive data (like hashed passwords and secrets).

## Initialize Lucia

In `$lib/server/lucia.ts`, import [`lucia`](/reference/api/server-api#lucia-default) from `lucia-auth`. Initialize it and export it as `auth` as usual. For [`env`](/reference/configure/lucia-configurations#env) config, checking if [`dev`](https://kit.svelte.dev/docs/modules#$app-environment-dev) (imported from `$app/environment`) is true is usually sufficient. Export the type of `auth` as well.

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

Create a server hooks file (`src/hooks.server.ts`) and import the `auth` module. Create and export a handle function with [`handleHooks()`](/sveltekit/api-reference/server-api#handlehooks).

```ts
// src/hooks.server.ts
import { auth } from "$lib/server/lucia";
import { handleHooks } from "@lucia-auth/sveltekit";

export const handle = handleHooks(auth);
```

If you have your own handle function, SvelteKit's [`sequence`](https://kit.svelte.dev/docs/modules#sveltejs-kit-hooks-sequence) can be used to chain multiple handle functions. Make sure Lucia's handle function is the first one.

```ts
// src/hooks.server.ts
import { auth } from "$lib/server/lucia";
import { handleHooks } from "@lucia-auth/sveltekit";

export const handle = sequence(handleHooks(auth), customHandle);
```

### Root layout

In your route root, create `+layout.server.ts` and `+layout.svelte`.

#### Client

In `+layout.svelte`, import [`handleSession()`](/sveltekit/api-reference/client-api#handlesession) from `@lucia-auth/sveltekit`. This will listen for change in sessions, sync sessions across tabs, and set a local client cache of the user. Since this also sets a context, it is required for other client side functions to work. Make sure not to subscribe to the `page` store passed on as the parameter.

```svelte
<!-- src/routes/+layout.svelte -->
<script lang="ts">
	import { page } from "$app/stores";
	import { handleSession } from "@lucia-auth/sveltekit/client";

	handleSession(page);
</script>

<slot />
```

#### Server load functions

In `+layout.server.ts`, create and export [`handleServerSession()`](/sveltekit/api-reference/server-api#handleserversession). This will pass on the session data from hooks to load functions.

```ts
// src/routes/+layout.server.ts
import { handleServerSession } from "@lucia-auth/sveltekit";

export const load = handleServerSession();
```

You can use your own load function by passing it on as an argument.

```ts
// src/routes/+layout.server.ts
import { handleServerSession } from "@lucia-auth/sveltekit";
import type { LayoutServerLoadEvent } from "./$types";

export const load = handleServerSession((e: LayoutServerLoadEvent) => {
	// ...
});
```

### Types

In `src/app.d.ts`, configure your types. The path in `import('$lib/server/lucia.js').Auth;` is where you exported `auth` (`lucia()`).

```ts
// src/app.d.ts
/// <reference types="lucia-auth" />
declare namespace Lucia {
	type Auth = import("$lib/server/lucia").Auth;
	type UserAttributes = {};
}

/// <reference types="@sveltejs/kit" />
declare namespace App {
	interface Locals {
		validate: import("@lucia-auth/sveltekit").Validate;
		validateUser: import("@lucia-auth/sveltekit").ValidateUser;
		setSession: import("@lucia-auth/sveltekit").SetSession;
	}
}
```
