---
title: "Sign in with username and password"
description: "Learn the basic of Lucia by implementing a basic username and password authentication"
---

_Before starting, make sure you've [setup Lucia and your database](/start-here/getting-started)._

This guide will cover how to implement a simple username and password authentication using Lucia.

## Update your database

Add a `username` column to your table. It should be a `string` (`TEXT`, `VARCHAR` etc) type that's unique.

Make sure you update `Lucia.DatabaseUserAttributes` whenever you add any new columns to the user table.

```ts
// app.d.ts

/// <reference types="lucia" />
declare namespace Lucia {
	type Auth = import("./lucia.js").Auth;
	type DatabaseUserAttributes = {
		username: string;
	};
	type DatabaseSessionAttributes = {};
}
```

## Configure Lucia

Since we're dealing with the standard `Request` and `Response`, we'll use the [`web()`](/reference/lucia/middleware#web) middleware. We're also setting [`sessionCookie.expires`](/basics/configuration#sessioncookie) to false since we can't update the session cookie when validating them.

```ts
// lucia.ts
import { lucia } from "lucia";
import { web } from "lucia/middleware";

export const auth = lucia({
	adapter: ADAPTER,
	env: "DEV", // "PROD" for production

	middleware: web(),
	sessionCookie: {
		expires: false
	}
});

export type Auth = typeof auth;
```

We also want to expose the user's username to the `User` object returned by Lucia's APIs. We'll define [`getUserAttributes`](/basics/configuration#getuserattributes) and return the username.

```ts
// lucia.ts
import { lucia } from "lucia";
import { web } from "lucia/middleware";

export const auth = lucia({
	adapter: ADAPTER,
	env: "DEV", // "PROD" for production
	middleware: web(),
	sessionCookie: {
		expires: false
	},

	getUserAttributes: (data) => {
		return {
			username: data.username
		};
	}
});

export type Auth = typeof auth;
```

## Sign up user

### Create users

This will be handled in a POST request.

Users can be created with [`Auth.createUser()`](/reference/lucia/interfaces/auth#createuser). This will create a new user, and if `key` is defined, a new key. The key here defines the connection between the user and the provided unique username (`providerUserId`) when using the username & password authentication method (`providerId`). We'll also store the password in the key. This key will be used get the user and validate the password when logging them in. The type for `attributes` property is `Lucia.DatabaseUserAttributes`, which we added `username` to previously.

After successfully creating a user, we'll create a new session with [`Auth.createSession()`](/reference/lucia/interfaces/auth#createsession). This session should be stored as a cookie, which can be created with [`Auth.createSessionCookie()`](/reference/lucia/interfaces/auth#createsessioncookie).

```ts
import { auth } from "./lucia.js";

post("/signup", async (request: Request) => {
	const formData = await request.formData();
	const username = formData.get("username");
	const password = formData.get("password");
	// basic check
	if (
		typeof username !== "string" ||
		username.length < 4 ||
		username.length > 31
	) {
		return new Response("Invalid username", {
			status: 400
		});
	}
	if (
		typeof password !== "string" ||
		password.length < 6 ||
		password.length > 255
	) {
		return new Response("Invalid password", {
			status: 400
		});
	}
	try {
		const user = await auth.createUser({
			key: {
				providerId: "username", // auth method
				providerUserId: username.toLowerCase(), // unique id when using "username" auth method
				password // hashed by Lucia
			},
			attributes: {
				username
			}
		});
		const session = await auth.createSession({
			userId: user.userId,
			attributes: {}
		});
		const sessionCookie = auth.createSessionCookie(session);
		// redirect to profile page
		return new Response(null, {
			headers: {
				Location: "/",
				"Set-Cookie": sessionCookie.serialize() // store session cookie
			},
			status: 302
		});
	} catch (e) {
		// this part depends on the database you're using
		// check for unique constraint error in user table
		if (
			e instanceof SomeDatabaseError &&
			e.message === USER_TABLE_UNIQUE_CONSTRAINT_ERROR
		) {
			return new Response("Username already taken", {
				status: 400
			});
		}

		return new Response("An unknown error occurred", {
			status: 500
		});
	}
});
```

#### Case sensitivity

Depending on your database, `user123` and `USER123` may be treated as different strings. To avoid 2 users having the same username with different cases, we are going to make the username lowercase before creating a key. This is crucial when setting a user-provided input as a provider user id of a key.

On the other hand, making the username stored as a user attribute lowercase is optional. However, if you need to query users using usernames (e.g. url `/user/user123`), it may be beneficial to require the username to be lowercase, store 2 usernames (lowercase and normal), or set the database to ignore casing when compare strings (e.g. using `LOWER()` in SQL).

```ts
const user = await auth.createUser({
	key: {
		providerId: "username", // auth method
		providerUserId: username.toLowerCase(), // unique id when using "username" auth method
		password // hashed by Lucia
	},
	attributes: {
		username
	}
});
```

#### Store session

Cookies can be stored with [`AuthRequest.setSession()`](/reference/lucia/interfaces/authrequest#setsession). A new [`AuthRequest`](/reference/lucia/interfaces/authrequest) instance can be created by calling [`Auth.handleRequest()`](/reference/lucia/interfaces/auth#handlerequest) with Express' `Request` and `Response`.

Alternatively, you can return the session in the response and store it locally in the device for single page and native applications.

#### Error handling

Lucia throws 2 types of errors: [`LuciaError`](/reference/lucia/main#luciaerror) and database errors from the database driver or ORM you're using. Most database related errors, such as connection failure, duplicate values, and foreign key constraint errors, are thrown as is. These need to be handled as if you were using just the driver/ORM.

```ts
if (
	e instanceof SomeDatabaseError &&
	e.message === USER_TABLE_UNIQUE_CONSTRAINT_ERROR
) {
	// username already taken
}
```

## Sign in user

### Authenticate users

The key we created for the user allows us to get the user via their username, and validate their password. This can be done with [`Auth.useKey()`](/reference/lucia/interfaces/auth#usekey). If the username and password is correct, we'll create a new session just like we did before. If not, Lucia will throw an error. Make sure to make the username lowercase before calling `useKey()`.

```ts
import { auth } from "./lucia.js";
import { LuciaError } from "lucia";

post("/login", async (request: Request) => {
	const formData = await request.formData();
	const username = formData.get("username");
	const password = formData.get("password");
	// basic check
	if (
		typeof username !== "string" ||
		username.length < 1 ||
		username.length > 31
	) {
		return new Response("Invalid username", {
			status: 400
		});
	}
	if (
		typeof password !== "string" ||
		password.length < 1 ||
		password.length > 255
	) {
		return new Response("Invalid password", {
			status: 400
		});
	}
	try {
		// find user by key
		// and validate password
		const user = await auth.useKey(
			"username",
			username.toLowerCase(),
			password
		);
		const session = await auth.createSession({
			userId: user.userId,
			attributes: {}
		});
		const sessionCookie = auth.createSessionCookie(session);
		return new Response(null, {
			headers: {
				Location: "/", // redirect to profile page
				"Set-Cookie": sessionCookie.serialize() // store session cookie
			},
			status: 302
		});
	} catch (e) {
		if (
			e instanceof LuciaError &&
			(e.message === "AUTH_INVALID_KEY_ID" ||
				e.message === "AUTH_INVALID_PASSWORD")
		) {
			// user does not exist
			// or invalid password
			return new Response("Incorrect username of password", {
				status: 400
			});
		}
		return new Response("An unknown error occurred", {
			status: 500
		});
	}
});
```

## Get authenticated user

You can validate requests and get the current session/user by either using [`AuthRequest.validate()`](/reference/lucia/interfaces/authrequest#validate) for session cookies, and [`AuthRequest.validateBearerToken()`](/reference/lucia/interfaces/authrequest#validatebearertoken) for session ids sent via the authorization header as a `Bearer` token. Both of these method returns a [`Session`](/reference/lucia/interfaces#session) if the user is authenticated or `null` if not.

You can see that `User.username` exists because we defined it with `getUserAttributes()` configuration.

```ts
import { auth } from "./lucia.js";

get("user/", async (request: Request) => {
	const authRequest = auth.handleRequest(request);
	const session = await authRequest.validate(); // or `authRequest.validateBearerToken()`
	if (session) {
		const user = session.user;
		const username = user.username;
		// ...
	}
	// ...
});
```

## Sign out users

When logging out users, it's critical that you invalidate the user's session. This can be achieved with [`Auth.invalidateSession()`](/reference/lucia/interfaces/auth#invalidatesession). You can delete the session cookie by overriding the existing one with a blank cookie that expires immediately. This can be created by passing `null` to `Auth.createSessionCookie()`.

```ts
import { auth } from "./lucia.js";

post("/logout", async (request: Request) => {
	const authRequest = auth.handleRequest(request);
	// check if user is authenticated
	const session = await authRequest.validate(); // or `authRequest.validateBearerToken()`
	if (!session) {
		return new Response("Not authenticated", {
			status: 401
		});
	}
	// make sure to invalidate the current session!
	await auth.invalidateSession(session.sessionId);

	// for session cookies
	// create blank session cookie
	const sessionCookie = auth.createSessionCookie(null);
	return new Response(null, {
		headers: {
			Location: "/login", // redirect to login page
			"Set-Cookie": sessionCookie.serialize() // delete session cookie
		},
		status: 302
	});
});
```
