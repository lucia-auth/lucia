---
title: "Sessions"
---

# Sessions

Sessions allow Lucia to keep track of requests made by authenticated users. The ID can be stored in a cookie or used as a traditional token manually added to each request. They should be created and stored on registration and login, validated on every request, and deleted on sign out.

```ts
interface Session extends SessionAttributes {
	id: string;
	userId: string;
	expiresAt: Date;
	fresh: boolean;
}
```

## Session lifetime

Sessions do not have an absolute expiration. The expiration gets extended whenever they're used. This ensures that active users remain signed in, while inactive users are signed out.

More specifically, if the session expiration is set to 30 days (default), Lucia will extend the expiration by another 30 days when there are less than 15 days (half of the expiration) until expiration. You can configure the expiration with the `sessionExpiresIn` configuration.

```ts
import { Lucia, TimeSpan } from "lucia";

export const lucia = new Lucia(adapter, {
	sessionExpiresIn: new TimeSpan(2, "w") // 2 weeks
});
```

## Define session attributes

Defining custom session attributes requires 2 steps. First, add the required columns to the session table. You can type it by declaring the `Register.DatabaseSessionAttributes` type.

```ts
declare module "lucia" {
	interface Register {
		Lucia: typeof lucia;
		DatabaseSessionAttributes: DatabaseSessionAttributes;
	}
	interface DatabaseSessionAttributes {
		ip_country: string;
	}
}
```

You can then include them in the session object with the `getSessionAttributes()` configuration.

```ts
const lucia = new Lucia(adapter, {
	getSessionAttributes: (attributes) => {
		return {
			ipCountry: attributes.ip_country
		};
	}
});

const session = await lucia.createSession();
session.ipCountry;
```

We do not automatically expose all database columns as

1. Each project has its own code styling rules
2. You generally don't want to expose sensitive data (even worse if you send the entire session object to the client)

## Create sessions

You can create a new session with `Lucia.createSession()`, which takes a user ID and an empty object.

```ts
const session = await lucia.createSession(userId, {});
```

If you have database attributes defined, pass their values as the second argument.

```ts
const session = await lucia.createSession(userId, {
	country: "us"
});

declare module "lucia" {
	interface Register {
		Lucia: typeof lucia;
		DatabaseSessionAttributes: DatabaseSessionAttributes;
	}
}

interface DatabaseSessionAttributes {
	country: string;
}
```

### Custom session IDs

You use your own session IDs with the `sessionId` option, though we recommend sticking with Lucia's default IDs as they provide a good balance between entropy and compactness. If you're using UUIDs, make sure they're generated using a cryptographically secure random source. Object IDs should not be used as session IDs as they do not provide enough entropy.

```ts
const session = await lucia.createSession(userId, attributes, {
	sessionId: generate
});
```

## Validate sessions

Use `Lucia.validateSession()` to validate a session using its ID. This will return an object containing a session and user. Both of these will be `null` if the session is invalid.

```ts
const { session, user } = await lucia.validateSession(sessionId);
```

If `Session.fresh` is `true`, it indicates the session expiration has been extended and you should set a new session cookie. If you cannot always set a new session cookie due to limitations of your framework, set the [`sessionCookie.expires`](/basics/configuration#sessioncookie) option to `false`.

```ts
const { session } = await lucia.validateSession(sessionId);
if (session && session.fresh) {
	// set session cookie
}
```

You can use [`Lucia.readSessionCookie()`](/reference/main/Lucia/readSessionCookie) and [`Lucia.readBearerToken()`](/reference/main/Lucia/readBearerToken) to get the session ID from the `Cookie` and `Authorization` header respectively.

```ts
const sessionId = lucia.readSessionCookie("auth_session=abc");
const sessionId = lucia.readBearerToken("Bearer abc");
```

See the [Validate session cookies](/guides/validate-session-cookies) and [Validate bearer tokens](/guides/validate-bearer-tokens) guide for a full example of validating session cookies.

## Session cookies

### Create session cookies

You can create a session cookie for a session with [`Lucia.createSessionCookie()`](/reference/main/Lucia/createSessionCookie). It takes a session and returns a new [`Cookie`](/reference/main/Cookie) instance. You can either use [`Cookie.serialize()`](https://oslo.js.org/reference/cookie/Cookie/serialize) to create `Set-Cookie` HTTP header value, or use your framework's API by accessing the name, value, and session.

```ts
const sessionCookie = lucia.createSessionCookie(session.id);

// set cookie directly
headers.set("Set-Cookie", sessionCookie.serialize());
// use your framework's cookie utility
setCookie(sessionCookie.name, sessionCookie.value, sessionCookie.attributes);
```

### Delete session cookie

You can delete a session cookie by setting a blank cookie created using [`Lucia.createBlankSessionCookie()`](/reference/main/Lucia/createBlankSessionCookie).

```ts
const sessionCookie = lucia.createBlankSessionCookie();

headers.set("Set-Cookie", sessionCookie.serialize());
setCookie(sessionCookie.name, sessionCookie.value, sessionCookie.attributes);
```

## Invalidate sessions

Use `Lucia.invalidateSession()` to invalidate a session. This should be used to sign out users. This will succeed even if the session ID is invalid.

```ts
await lucia.invalidateSession(sessionId);
```

### Invalidate all user sessions

Use `Lucia.invalidateUserSessions()` to invalidate all sessions belonging to a user.

```ts
await lucia.invalidateUserSessions(userId);
```

## Get all user sessions

Use `Lucia.getUserSessions()` to get all sessions belonging to a user. This will return an empty array if the user does not exist. Invalid sessions will be omitted from the array.

```ts
const sessions = await lucia.getUserSessions(userId);
```

## Delete all expired sessions

Use `Lucia.deleteExpiredSessions()` to delete all expired sessions in the database. We recommend setting up a cron-job to clean up your database on a set interval.

```ts
await lucia.deleteExpiredSessions();
```
