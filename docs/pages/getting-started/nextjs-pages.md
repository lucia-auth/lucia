---
title: "Getting started in Next.js Pages router"
---

# Getting started in Next.js Pages router

## Installation

Install Lucia using your package manager of your choice, for example with npm:

```
npm install lucia
```

## Initialize Lucia

Import `Lucia` and initialize it with your adapter. Refer to the [Database](/database) page to learn how to set up your database and initialize the appropriate adapter. In this quickstart, we use the [SQLite adapter](/database/sqlite), but you can easily substitute another adapter:

```ts
// src/auth.ts
import { Lucia } from "lucia";
import { BetterSqlite3Adapter } from "@lucia-auth/adapter-sqlite";
import { db } from './db';

// configure adapter database and auth tables
const adapter = new BetterSqlite3Adapter(db, {
	user: "user",
	session: "session"
});

// configure the session cookie behavior
export const lucia = new Lucia(adapter, {
	sessionCookie: {
		attributes: {
			secure: process.env.NODE_ENV === "production" // 'true' when using HTTPS
		}
	}
});

// register your 'Lucia' instance type
declare module "lucia" {
	interface Register {
		Lucia: typeof lucia;
	}
}
```

## Polyfill

If you're using Node.js 18 or below, you'll need to polyfill the Web Crypto API. This is not required in Node.js 20, CloudFlare Workers, Deno, Bun, and Vercel Edge Functions. This can be done either by importing `webcrypto`, or by enabling an experimental flag.

```ts
import { webcrypto } from "node:crypto";

globalThis.crypto = webcrypto as Crypto;
```

```
node --experimental-web-crypto index.js
```

## Set up middleware

If you're planning to use cookies, you must implement CSRF protection.

```ts
// middleware.ts
import { verifyRequestOrigin } from "lucia";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export async function middleware(request: NextRequest): Promise<NextResponse> {
	if (request.method === "GET") {
		return NextResponse.next();
	}
	const originHeader = request.headers.get("Origin");
	const hostHeader = request.headers.get("Host");
	if (!originHeader || !hostHeader || !verifyRequestOrigin(originHeader, [hostHeader])) {
		return new NextResponse(null, {
			status: 403
		});
	}
	return NextResponse.next();
}
```

## Next steps

You can learn all the concepts and APIs by reading the [Basics section](/basics/sessions) in the docs. If you prefer writing code immediately, check out the [Tutorials](/tutorials) page or the [examples repository](https://github.com/lucia-auth/examples/tree/main).

This documentation often references [the Copenhagen Book](https://thecopenhagenbook.com). This is an open-source guide on implementing auth and should come in handy when implementing anything auth, including passkeys, multi-factor authentication, and a bit of cryptography. We recommend reading it to learn more about auth in web applications.

If you have any questions, [join our Discord server](https://discord.com/invite/PwrK3kpVR3)!
