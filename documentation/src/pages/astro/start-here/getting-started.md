---
order: 0
layout: "@layouts/DocumentLayout.astro"
title: "Getting started"
---

Install Lucia and the Astro integration using your package manager of your choice. `lucia-auth` can be used as is in a server environment (and only inside it), and `@lucia-auth/astro` provides Astro specific code to be used in the server.

```bash
npm i lucia-auth @lucia-auth/astro
pnpm add lucia-auth @lucia-auth/astro
yarn add lucia-auth @lucia-auth/astro
```

## Set up the database

Using the guide from the adapter docs, set up the database and install the adapter (adapters are provided as a different NPM package).

## Initialize Lucia

In `src/lib/lucia.ts`, import [`lucia`](/reference/api/server-api#lucia-default) from `lucia-auth`. Initialize it and export it as `auth` as usual. For [`env`](/reference/configure/lucia-configurations#env) config, it should `DEV` if in development and `PROD` if in production.

```ts
// src/lib/lucia.ts
import lucia from "lucia-auth";
import prisma from "@lucia-auth/adapter-prisma";
import { dev } from "$app/environment";

export const auth = lucia({
	adapter: prisma(prismaClient),
	env: "DEV" // "PROD" if in prod
});

export type Auth = typeof auth;
```

This module and the file that holds it **should NOT be imported from the client**.

## Configure your Astro project

Astro specific functions are imported from `@lucia-auth/astro`.

### Enable SSR

Enable Server-side rendering by setting `output` to `"server"` inside `astro.config.mjs`.

```diff
export default defineConfig({
  integrations: [],
+  output: "server"
});
```

### API endpoints

Create an API route. Import [`handleLogoutRequests()`](/astro/api-reference/server-api#handlelogoutrequests) and export is as `post`. This will handle sign outs.

```ts
// eg. pages/api/logout.ts
import { handleLogoutRequests } from "@lucia-auth/astro";
import { auth } from "../../lib/lucia";

export const post = handleLogoutRequests(auth);
```

### Types

Create `src/lucia.d.ts`, and inside it configure your types. The path in `import('./lib/lucia.js').Auth;` is where you exported `auth` (`lucia()`).

```ts
// src/lucia.d.ts
/// <reference types="lucia-auth" />
declare namespace Lucia {
	type Auth = import("./lib/lucia.js").Auth;
	type UserAttributes = {};
}
```
