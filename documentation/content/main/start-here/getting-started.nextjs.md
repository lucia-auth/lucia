---
_order: 1
title: "Getting started"
description: "Learn how to get started with Lucia using Next.js"
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

In `auth/lucia.ts`, import [`lucia`](/reference/modules/lucia-auth#lucia) from `lucia-auth`. Initialize it by defining `adapter` and `env` and export it. Make sure to export `typeof auth` as well.

```ts
// auth/lucia.ts
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

### Types

Create `lucia.d.ts`, and inside it configure your types. The path in `import('./auth/lucia.js').Auth;` is where you exported `auth` (`lucia()`).

```ts
// lucia.d.ts
/// <reference types="lucia-auth" />
declare namespace Lucia {
	type Auth = import("./auth/lucia.js").Auth;
	type UserAttributes = {};
}
```
