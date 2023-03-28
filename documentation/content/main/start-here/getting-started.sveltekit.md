---
_order: 1
title: "Getting started"
description: "Learn how to get started with Lucia using SvelteKit"
---

Install Lucia using your package manager of your choice.

```
npm i lucia-auth
pnpm add lucia-auth
yarn add lucia-auth
```

## Set up the database

Using the guide from the adapter docs, set up the database and install the adapter (adapters are provided as a different NPM package).

> (warn) Anything inside the `user` database will be sent to the client. While this is fine for most situations, make sure you aren't storing any sensitive data (like hashed passwords and secrets).

## Initialize Lucia

In `$lib/server/lucia.ts`, import [`lucia`](/reference/modules/lucia-auth#lucia) from `lucia-auth`. Initialize it by defining `adapter` and `env` and export it. Additionally, we will import the SvelteKit middleware and pass it on to `middleware`. Make sure to export `typeof auth` as well.

```ts
// lib/server/lucia.ts
import lucia from "lucia-auth";
import { sveltekit } from "lucia-auth/middleware";
import prisma from "@lucia-auth/adapter-prisma";
import { dev } from "$app/environment";

export const auth = lucia({
	adapter: prisma(prismaClient),
	env: dev ? "DEV" : "PROD",
	middleware: sveltekit()
});

export type Auth = typeof auth;
```

This module and the file that holds it **should NOT be imported from the client**.

## Configure your SvelteKit project

### Hooks

Create a server hooks file (`src/hooks.server.ts`) and import the `auth` module. Since we used the SvelteKit middleware, `handleRequest()` is compatible with SvelteKit's APIs.

```ts
// hooks.server.ts
import { auth } from "$lib/server/lucia";
import type { Handle } from "@sveltejs/kit";

export const handle: Handle = async ({ event, resolve }) => {
	event.locals.auth = auth.handleRequest(event);
	return await resolve(event);
};
```

You can now get the current session and user using the methods within `event.locals.auth`, which is available in every server context.

```ts
const session = await event.locals.auth.validate();
const { session, user } = await event.locals.auth.validateUser();
```

### Defining types

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
		auth: import("lucia-auth").AuthRequest;
	}
}
```
