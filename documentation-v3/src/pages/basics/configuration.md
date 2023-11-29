---
layout: "@layouts/DocLayout.astro"
title: "Configuration"
---

This page shows all the options for [`Lucia`]() to configure Lucia.

```ts
interface Options {
	middleware?: _Middleware;
	csrfProtection?: boolean | CSRFProtectionOptions;
	sessionExpiresIn?: TimeSpan;
	sessionCookie?: SessionCookieOptions;
	getSessionAttributes?: (
		databaseSessionAttributes: DatabaseSessionAttributes
	) => _SessionAttributes;
	getUserAttributes?: (databaseUserAttributes: DatabaseUserAttributes) => _UserAttributes;
}
```

## `middleware`

See [middleware]().

```ts
import { Lucia } from "lucia";
import { sveltekit } from "lucia/middleware";

const auth = new Lucia(adapter, {
	middleware: sveltekit()
});
```

## `csrfProtection`

CSRF protection is enabled (`true`) by default for [`AuthRequest.handleRequest()`](). Disable it by passing `false`. You can configure the behavior for `AuthRequest.handleRequest()` or [`Lucia.verifyRequestOrigin()`]() by passing an object.

By default, Lucia uses the `Host` header to determine the current domain. You can change that with the `hostHeader` option or manually defining domains in `allowedHeaders`.

```ts
import { Lucia } from "lucia";

const auth = new Lucia(adapter, {
	csrfProtection: {
		allowedHeaders: ["api.example.com"],
		hostHeader: "X-Forwarded-Host" // default: `Host`
	}
});
```

## `sessionExpiresIn`

Configures how long a session is valid max for inactive users. Sessions expiration are automatically extended for active users. Also see [`TimeSpan`]().

```ts
import { Lucia, TimeSpan } from "lucia";

const auth = new Lucia(adapter, {
	sessionExpiresIn: new TimeSpan(2, "w")
});
```

## `sessionCookie`

Configures the session cookie. See [Using cookies]() for the default session cookie attributes.

```ts
import { Lucia } from "lucia";

const auth = new Lucia(adapter, {
	sessionCookie: {
		name: "session",
		expires: false, // session cookies have very long lifespan (2 years)
		attributes: {
			secure: true,
			sameSite: "strict",
			domain: "example.com"
		}
	}
});
```

## `getSessionAttributes()`

Transforms database session attributes, which is typed as `DatabaseSessionAttributes`. The returned object is added to the `Session` object.

```ts
import { Lucia } from "lucia";

const auth = new Lucia(adapter, {
	getSessionAttributes: (attributes) => {
		return {
			ipCountry: attributes.ip_country
		};
	}
});

declare module "lucia" {
	interface Register {
		Lucia: typeof auth;
		DatabaseSessionAttributes: {
			ip_country: string;
		};
	}
}
```

## `getUserAttributes()`

Transforms database user attributes, which is typed as `DatabaseUserAttributes`. The returned object is added to the `User` object.

```ts
import { Lucia } from "lucia";

const auth = new Lucia(adapter, {
	getUserAttributes: (attributes) => {
		return {
			username: attributes.username
		};
	}
});

declare module "lucia" {
	interface Register {
		Lucia: typeof auth;
		DatabaseUserAttributes: {
			username: string;
		};
	}
}
```
