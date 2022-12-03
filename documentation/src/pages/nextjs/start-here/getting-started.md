---
order: 0
layout: "@layouts/DocumentLayout.astro"
title: "Getting started"
---

Install Lucia and the Next.js integration using your package manager of your choice. `lucia-auth` can be used as is in a server environment (and only inside it), and `@lucia-auth/nextjs` provides Next.js specific code for both the backend and frontend.

```bash
npm i lucia-auth @lucia-auth/nextjs
pnpm add lucia-auth @lucia-auth/nextjs
yarn add lucia-auth @lucia-auth/nextjs
```

## Set up the database

Using the guide from the adapter docs, set up the database and install the adapter (adapters are provided as a different NPM package).

## Initialize Lucia

In `lib/lucia.ts`, import [`lucia`](/reference/api/server-api#lucia-default) from `lucia-auth`. Initialize it and export it as `auth` as usual. For [`env`](/reference/configure/lucia-configurations#env) config, it should `DEV` if in development and `PROD` if in production.

```ts
// lib/lucia.ts
import lucia from "lucia-auth";
import prisma from "@lucia-auth/adapter-prisma";
import { dev } from "$app/environment";

export const auth = lucia({
	adapter: prisma(prismaClient),
	env: process.env.NODE_ENV === "development" ? "DEV" : "PROD"
});

export type Auth = typeof auth;
```

This module and the file that holds it **should NOT be imported from the client**.

## Configure your Next.js project

Next.js specific functions are imported from `@lucia-auth/nextjs`.

### API endpoints

Inside `pages/api` (or `pages/api/auth`), create `[...lucia].ts`. Import [`handleApiRoutes()`](/nextjs/api-reference/server-api#handleapiroutes) and export it as the default. This will handle API requests related to auth.

```ts
// pages/api/[...lucia].ts
import { handleApiRoutes } from "@lucia-auth/nextjs";
import { auth } from "../../lib/lucia";

export default handleApiRoutes(auth);
```

### Types

Create `lucia.d.ts`, and inside it configure your types. The path in `import('./lib/lucia.js').Auth;` is where you exported `auth` (`lucia()`).

```ts
// lucia.d.ts
/// <reference types="lucia-auth" />
declare namespace Lucia {
	type Auth = import("./lib/lucia.js").Auth;
	type UserAttributes = {};
}
```
