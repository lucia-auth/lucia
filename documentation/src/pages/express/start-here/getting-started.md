---
order: 0
layout: "@layouts/DocumentLayout.astro"
title: "Getting started"
---

Install Lucia and the Express integration using your package manager of your choice.

```bash
npm i lucia-auth @lucia-auth/express
pnpm add lucia-auth @lucia-auth/express
yarn add lucia-auth @lucia-auth/express
```

## Set up the database

Using the guide from the adapter docs, set up the database and install the adapter (adapters are provided as a different NPM package).

## Initialize Lucia

In `lucia.ts`, import [`lucia`](/reference/api/server-api#lucia) from `lucia-auth`. Initialize it and export it as `auth` as usual. For [`env`](/reference/configure/lucia-configurations#env) config, it should `DEV` if in development and `PROD` if in production.

```ts
// lib/server/lucia.ts
import lucia from "lucia-auth";
import prisma from "@lucia-auth/adapter-prisma";
import { dev } from "$app/environment";

export const auth = lucia({
	adapter: prisma(prismaClient),
	env: "DEV" // "PROD" if in prod
});

export type Auth = typeof auth;
```

## Configure your project

### Middleware

Import [`handleMiddleware()`](/express/api-reference/server-api#handlemiddleware) and use it as your app's middleware.

```ts
import express from "express";
import { auth } from "./lucia.js";
import { handleMiddleware } from "@lucia-auth/express";

const app = express();

app.use(handleMiddleware(auth));
```

### Types

Create a type declaration file (`.d.ts`) and configure the types. The path in `import('./lucia.js').Auth;` is where you exported `auth` (`lucia()`).

```ts
// src/app.d.ts
/// <reference types="lucia-auth" />
declare namespace Lucia {
	type Auth = import("./lucia.js").Auth;
	type UserAttributes = {};
}
```
