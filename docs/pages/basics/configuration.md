---
layout: "@components/Layout.astro"
title: "Configuration"
---

# Configuration

This page shows all the options for [`Lucia`](/reference/main/Lucia) to configure Lucia.

```ts
interface Options {
	sessionExpiresIn?: TimeSpan;
	sessionCookie?: SessionCookieOptions;
	getSessionAttributes?: (
		databaseSessionAttributes: DatabaseSessionAttributes
	) => _SessionAttributes;
	getUserAttributes?: (databaseUserAttributes: DatabaseUserAttributes) => _UserAttributes;
}
```

## `sessionExpiresIn`

Configures how long a session is valid max for inactive users. Sessions expiration are automatically extended for active users. Also see [`TimeSpan`](/reference/main/TimeSpan).

```ts
import { Lucia, TimeSpan } from "lucia";

const lucia = new Lucia(adapter, {
	sessionExpiresIn: new TimeSpan(2, "w")
});
```

## `sessionCookie`

Configures the session cookie.

```ts
import { Lucia } from "lucia";

const lucia = new Lucia(adapter, {
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

const lucia = new Lucia(adapter, {
	getSessionAttributes: (attributes) => {
		return {
			ipCountry: attributes.ip_country
		};
	}
});

declare module "lucia" {
	interface Register {
		Lucia: typeof lucia;
	}
	interface DatabaseSessionAttributes {
		country: string;
	}
}
```

## `getUserAttributes()`

Transforms database user attributes, which is typed as `DatabaseUserAttributes`. The returned object is added to the `User` object.

```ts
import { Lucia } from "lucia";

const lucia = new Lucia(adapter, {
	getUserAttributes: (attributes) => {
		return {
			username: attributes.username
		};
	}
});

declare module "lucia" {
	interface Register {
		Lucia: typeof lucia;
	}
	interface DatabaseUserAttributes {
		username: string;
	}
}
```
