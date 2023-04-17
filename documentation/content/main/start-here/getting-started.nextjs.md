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

In `auth/lucia.ts`, import [`lucia`](/reference/lucia-auth/auth) from `lucia-auth`. Initialize it by defining `adapter` and `env` and export it. Additionally, we will import the Node middleware and pass it on to `middleware`. Make sure to export `typeof auth` as well.

```ts
// auth/lucia.ts
import lucia from "lucia-auth";
import { node } from "lucia-auth/middleware";
import prisma from "@lucia-auth/adapter-prisma";
import { prismaClient } from "@prisma/client";
import { dev } from "$app/environment";

export const auth = lucia({
	adapter: prisma(prismaClient),
	env: process.env.NODE_ENV === "development" ? "DEV" : "PROD",
	middleware: node()
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

## Polyfill `crypto` global

**This is only required for Node.js v18 and below.** Import `lucia-auth/polyfill/node` in `lucia.ts`.

```ts
// auth/lucia.ts
import lucia from "lucia-auth";
import "lucia-auth/polyfill/node";

// ...

export const auth = lucia({
	adapter: prisma(prismaClient),
	env: process.env.NODE_ENV === "development" ? "DEV" : "PROD",
	middleware: node()
});

export type Auth = typeof auth;
```

Alternatively, add the `--experimental-global-webcrypto` flag to the `dev` and `build` command:

```json
{
	// ...
	"scripts": {
		"dev": "NODE_OPTIONS=--experimental-global-webcrypto next dev",
		"start": "NODE_OPTIONS=--experimental-global-webcrypto next start"
		// ...
	}
	// ...
}
```

If you're using Node v14, you'll need to use a third party polyfill and set it as a global variable:

```ts
globalThis.crypto = cryptoPolyfill;
```
