---
layout: "@layouts/MainLayout.astro"
title: "Troubleshooting"
---

Here are some common issues and how to resolve them. Feel free to ask for help in our Discord server.

## `User` and `Session` are typed as `any`

Make sure you've registered your types. Check the `typeof auth` is indeed an instance of `Lucia` (not a function that returns `Lucia`) and that there are no TS errors (including `@ts-ignore`) when declaring `Lucia`. `Register` must be an `interface`, not `type`.

```ts
import { Lucia } from "lucia";

const auth = new Lucia(adapter, {
	// no ts errors
});

declare module "lucia" {
	interface Register {
		Lucia: typeof auth;
	}
}
```

## Session cookies are not set in `localhost`

By default, session cookies have a `Secure` flag, which require HTTPS. You can disable it for development with the `sessionCookie.attributes.secure` configuration.

```ts
import { Lucia } from "lucia";

const auth = new Lucia(adapter, {
	sessionCookie: {
		attributes: {
			secure: !devMode // disable when `devMode` is `true`
		}
	}
});
```

## Can't validate POST requests

If you're using `AuthRequest.validate()` and it returns `null` even if the session cookie exists, it's likely caused by Lucia's CSRF protection. To debug, check the `Origin` and `Host` header. The hostname (domain) must exactly match. You can use a different header to get the host, manually add allowed domains, or disable CSRF protection entirely (not recommended).

```ts
import { Lucia } from "lucia";

const auth = new Lucia(adapter, {
	csrfProtection: {
        hostHeader: "X-Forwarded-Host", // use X-Forwarded-Host instead of Host
        allowedDomains: ["api.example.com"] // allow api.example.com
    }
});

// disable CSRF protection
const auth = new Lucia(adapter, {
	csrfProtection: false
});
```

## `crypto` is not defined

You're likely using a runtime that doesn't support the Web Crypto API, such as Node.js 18 and below. Polyfill it by importing `webcrypto`.


```ts
import { webcrypto } from "node:crypto";

globalThis.crypto = webcrypto as Crypto;
```