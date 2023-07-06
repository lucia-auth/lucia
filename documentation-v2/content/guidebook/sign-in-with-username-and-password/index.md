---
title: "Sign in with email and password"
description: "Learn the basic of Lucia by implementing a basic username and password authentication"
_order: "0"
---

_Before starting, make sure you've [setup Lucia and your database](/start-here/getting-started)._

This guide will cover how to implement a simple username and password authentication using Lucia. It will have 3 parts:

- A sign up page
- A sign in page
- A profile page with a logout button

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

## Sign up page

Create route `/signup`. `signup.html` will have a form with inputs for username and password

```html
<!-- signup.html -->
<html lang="en">
	<head>
		<meta charset="utf-8" />
	</head>
	<body>
		<h1>Sign up</h1>
		<form method="post">
			<label for="username">Username</label>
			<input name="username" id="username" /><br />
			<label for="password">Password</label>
			<input type="password" name="password" id="password" /><br />
			<input type="submit" />
		</form>
		<a href="/login">Sign in</a>
	</body>
</html>
```

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
				providerUserId: username, // unique id when using "username" auth method
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

### Redirect authenticated users

Authenticated users should be redirected to the profile page whenever they try to access the sign up page. You can validate requests by creating a new [`AuthRequest` instance](/reference/lucia/interfaces/authrequest) with [`Auth.handleRequest()`](/reference/lucia/interfaces/auth#handlerequest) and calling [`AuthRequest.validate()`](/reference/lucia/interfaces/authrequest#validate). This method returns a [`Session`](/reference/lucia/interfaces#session) if the user is authenticated or `null` if not.

Since we're using the `web()` middleware, `Auth.handleRequest()` expects the standard `Request`.

```ts
import { auth } from "./lucia.js";

get("/signup", async (request: Request) => {
	const authRequest = auth.handleRequest(request);
	const session = await authRequest.validate();
	if (session) {
		// redirect to profile page
		return new Response(null, {
			headers: {
				Location: "/"
			},
			status: 302
		});
	}
	return renderPage();
});
```

## Sign in page

Create route `/login`. `login.html` will have a form with inputs for username and password.

```html
<!-- login.html -->
<html lang="en">
	<head>
		<meta charset="utf-8" />
	</head>
	<body>
		<h1>Sign in</h1>
		<form method="post">
			<label for="username">Username</label>
			<input name="username" id="username" /><br />
			<label for="password">Password</label>
			<input type="password" name="password" id="password" /><br />
			<input type="submit" />
		</form>
		<a href="/signup">Create an account</a>
	</body>
</html>
```

### Authenticate users

This will be handled in a POST request.

The key we created for the user allows us to get the user via their username, and validate their password. This can be done with [`Auth.useKey()`](/reference/lucia/interfaces/auth#usekey). If the username and password is correct, we'll create a new session just like we did before. If not, Lucia will throw an error.

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
		const user = await auth.useKey("username", username, password);
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

### Redirect authenticated users

As we did in the sign up page, redirect authenticated users to the profile page.

```ts
import { auth } from "./lucia.js";

get("/login", async (request: Request) => {
	const authRequest = auth.handleRequest(request);
	const session = await authRequest.validate();
	if (session) {
		// redirect to profile page
		return new Response(null, {
			headers: {
				Location: "/"
			},
			status: 302
		});
	}
	return renderPage();
});
```

## Profile page

Create route `/`. `index.html` will show some basic user info and include a logout button.

```html
<!-- index.html -->
<html lang="en">
	<head>
		<meta charset="utf-8" />
	</head>
	<body>
		<h1>Profile</h1>
		<!-- some template stuff -->
		<p>User id: %%user_id%%</p>
		<p>Username: %%username%%</p>
		<form method="post" action="/logout">
			<input type="submit" value="Sign out" />
		</form>
	</body>
</html>
```

### Get authenticated user

Unauthenticated users should be redirected to the login page. The user object is available in `Session.user`, and you'll see that `User.username` exists because we defined it in first step with `getUserAttributes()` configuration.

```ts
import { auth } from "./lucia.js";

get("/", async (request: Request) => {
	const authRequest = auth.handleRequest(request);
	const session = await authRequest.validate();
	if (!session) {
		// redirect to login page
		return new Response(null, {
			headers: {
				Location: "/login"
			},
			status: 302
		});
	}
	return renderPage({
		// display dynamic data
		user_id: session.user.userId,
		username: session.user.username
	});
});
```

### Sign out users

Create `/logout` and handle POST requests.

When logging out users, it's critical that you invalidate the user's session. This can be achieved with [`Auth.invalidateSession()`](/reference/lucia/interfaces/auth#invalidatesession). You can delete the session cookie by overriding the existing one with a blank cookie that expires immediately. This can be created by passing `null` to `Auth.createSessionCookie()`.

```ts
import { auth } from "./lucia.js";

post("/logout", async (request: Request) => {
	const authRequest = auth.handleRequest(request);
	// check if user is authenticated
	const session = await authRequest.validate();
	if (!session) {
		return new Response("Not authenticated", {
			status: 401
		});
	}
	// make sure to invalidate the current session!
	await auth.invalidateSession(session.sessionId);
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
