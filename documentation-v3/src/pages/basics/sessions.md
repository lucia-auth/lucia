---
layout: "@layouts/DocLayout.astro"
title: "Sessions"
---

Sessions allow Lucia to keep track of requests made by authenticated users. The id can be stored in a cookie or used as a traditional token manually added to each request. They should be created and stored on registration and login, validated on every request, and deleted on sign out.

```ts
interface Session extends SessionAttributes {
	id: string;
	userId: string;
	expiresAt: Date;
	fresh: boolean;
}
```

## Session lifetime

Sessions do not have an absolute expiration. The expiration gets extended whenever they're used. This ensures that active users are signed in, while inactive users are signed out.

More specifically, if the session expiration is set to 30 days (default), Lucia will extend the expiration by another 30 days when there's less than 15 days (half of the expiration) until expiration. You can configure the expiration with the `sessionExpiresIn` configuration.

```ts
import { Lucia, TimeSpan } from "lucia";

export const auth = new Lucia(adapter, {
	sessionExpiresIn: new TimeSpan(2, "w") // 2 weeks
});
```

## Define session attributes

Defining custom session attributes requires 2 steps. First, add the required columns to the session table. You can type it by declaring the `DatabaseSessionAttributes` type.

```ts
declare module "lucia" {
	interface Register {
		Lucia: typeof auth;
		DatabaseSessionAttributes: {
			ip_country: string;
		};
	}
}
```

You can then include them into the session object with the `getSessionAttributes()` configuration.

```ts
const auth = new Lucia(adapter, {
	getSessionAttributes: (attributes) => {
		return {
			ipCountry: attributes.ip_country
		};
	}
});

const session = await auth.createSession();
session.ipCountry;
```

We do not automatically expose all database columns as

1. Each project has their code styling rules
2. You generally don't want to expose sensitive data (even worse if you send the entire session object to the client)

## Create sessions

You can create a new session with `Lucia.createSession()`, which takes a user ID and an empty object.

```ts
const session = await auth.createSession(userId, {});
```

If you have database attributes defined, pass their values as the second argument.

```ts
const session = await auth.createSession(userId, {
	ip_country: "us"
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

## Validate sessions

Use `Lucia.validateSession()` to validate a session using its ID. This will return an object containing a session and user. Both of these will be `null` if the session does not exist in the database or is expired.

```ts
const { session, user } = await auth.validateSession(sessionId);
if (session) {
	const userId = user.id;
} else {
	// delete session cookie
}
```

If `Session.fresh` is `true`, you need to set the session cookie again.

```ts
const { session } = await auth.validateSession(sessionId);
if (session && session.fresh) {
	// set session cookie
}
```

## Invalidate sessions

Use `Lucia.invalidateSession()` to invalidate a session. This should be used to sign out users. This will succeed even if the session ID is invalid.

```ts
await auth.invalidateSession(sessionId);
```

### Invalidate all user sessions

Use `Lucia.invalidateUserSessions()` to invalidate all sessions belonging to a user.

```ts
await auth.invalidateUserSessions(userId);
```

## Get all user sessions

Use `Lucia.getUserSessions()` to get all sessions belonging to a user. This will return an empty array if the user does not exist. Invalid sessions will be omitted from the array.

```ts
const sessions = await auth.getUserSessions(userId);
```
