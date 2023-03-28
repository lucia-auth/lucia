---
_order: 1
title: "Getting started"
description: "Learn how to get started with Lucia using Astro"
---

Install Lucia using your package manager of your choice.

```
npm i lucia-auth
pnpm add lucia-auth
yarn add lucia-auth
```

## Set up the database

Using the guide from the adapter docs, set up the database and install the adapter (adapters are provided as a different NPM package).

## Initialize Lucia

In `src/lib/lucia.ts`, import [`lucia`](/reference/modules/lucia-auth#lucia) from `lucia-auth`. Initialize it by defining `adapter` and `env` and export it. Additionally, we will import the Astro middleware and pass it on to `middleware`. Make sure to export `typeof auth` as well.

```ts
// src/lib/lucia.ts
import lucia from "lucia-auth";
import prisma from "@lucia-auth/adapter-prisma";
import { astro } from "lucia-auth/middleware";

export const auth = lucia({
	adapter: prisma(prismaClient),
	env: dev ? "DEV" : "PROD",
	middleware: astro()
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
