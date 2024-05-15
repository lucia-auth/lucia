---
title: "Troubleshooting"
---

# Troubleshooting

Here are some common issues and how to resolve them. Feel free to ask for help in our Discord server.

## `User` and `Session` are typed as `any`

Make sure you've registered your types. Check that the `typeof lucia` is indeed an instance of `Lucia` (not a function that returns `Lucia`) and that there are no TS errors (including `@ts-ignore`) when declaring `Lucia`. `Register` must be an `interface`, not a `type`.

```ts
import { Lucia } from "lucia";

const lucia = new Lucia(adapter, {
	// no ts errors
});

declare module "lucia" {
	interface Register {
		Lucia: typeof lucia;
	}
}
```

**Also check that you're passing `typeof lucia` and not `typeof Lucia`** (notice the capitalization - `lucia` is an instance of class `Lucia`).

## Session cookies are not set in `localhost`

By default, session cookies have a `Secure` flag, which requires HTTPS. You can disable it for development with the `sessionCookie.attributes.secure` configuration.

```ts
import { Lucia } from "lucia";

const lucia = new Lucia(adapter, {
	sessionCookie: {
		attributes: {
			secure: !devMode // disable when `devMode` is `true`
		}
	}
});
```

## Can't validate POST requests

Check your CSRF protection implementation. If you're using the code provided by the documentation, check the `Origin` and `Host` header. The hostname must match exactly. You can add additional domains to the array to allow more domains.

```ts
import { verifyRequestOrigin } from "lucia";

verifyRequestOrigin(originHeader, [hostHeader, "api.example.com" /*...*/]);
```

## `crypto` is not defined

You're likely using a runtime that doesn't support the Web Crypto API, such as Node.js 18 and below. Polyfill it by importing `webcrypto`.

```ts
import { webcrypto } from "node:crypto";

globalThis.crypto = webcrypto as Crypto;
```
