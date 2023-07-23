---
title: "Sign in with username and password in Express"
menuTitle: "Express"
description: "Learn the basic of Lucia by implementing a basic username and password authentication in Express"
---

_Before starting, make sure you've [setup Lucia and your database](/start-here/getting-started/express)._

This guide will cover how to implement a simple username and password authentication using Lucia.

### Clone project

You can get started immediately by cloning the [Express example](https://github.com/pilcrowOnPaper/lucia/tree/main/examples/express/username-and-password) from the repository.

```
npx degit pilcrowonpaper/lucia/examples/express/username-and-password <directory_name>
```

Alternatively, you can [open it in StackBlitz](https://stackblitz.com/github/pilcrowOnPaper/lucia/tree/main/examples/express/username-and-password).

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

We'll expose the user's username to the `User` object by defining [`getUserAttributes`](/basics/configuration#getuserattributes).

```ts
// lucia.ts
import { lucia } from "lucia";
import { express } from "lucia/middleware";

export const auth = lucia({
	adapter: ADAPTER,
	env: process.env.NODE_ENV === "development" ? "DEV" : "PROD",
	middleware: express(),

	getUserAttributes: (data) => {
		return {
			username: data.username
		};
	}
});

export type Auth = typeof auth;
```

## Configure Express

Set up the body parser middleware.

```ts
import express from "express";

const app = express();

app.use(express.urlencoded()); // for application/x-www-form-urlencoded (forms)
app.use(express.json()); // for application/json
```

## Sign up user

### Create users

Users can be created with [`Auth.createUser()`](/reference/lucia/interfaces/auth#createuser). This will create a new user, and if `key` is defined, a new key. The key here defines the connection between the user and the provided unique username (`providerUserId`) when using the username & password authentication method (`providerId`). We'll also store the password in the key. This key will be used get the user and validate the password when logging them in. The type for `attributes` property is `Lucia.DatabaseUserAttributes`, which we added `username` to previously.

After successfully creating a user, we'll create a new session with [`Auth.createSession()`](/reference/lucia/interfaces/auth#createsession), which will be stored in the user's device.

```ts
import { auth } from "./lucia.js";

app.get("/signup", async (req, res) => {
	return renderPage("signup.html"); // example
});

app.post("/signup", async (req, res) => {
	const { username, password } = req.body;
	// basic check
	if (
		typeof username !== "string" ||
		username.length < 4 ||
		username.length > 31
	) {
		return res.status(400).send("Invalid username");
	}
	if (
		typeof password !== "string" ||
		password.length < 6 ||
		password.length > 255
	) {
		return res.status(400).send("Invalid password");
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
		const authRequest = auth.handleRequest(req, res);
		authRequest.setSession(session);
		// redirect to profile page
		return res.status(302).setHeader("Location", "/").end();
	} catch (e) {
		// this part depends on the database you're using
		// check for unique constraint error in user table
		if (
			e instanceof SomeDatabaseError &&
			e.message === USER_TABLE_UNIQUE_CONSTRAINT_ERROR
		) {
			return res.status(400).send("Username already taken");
		}

		return res.status(500).send("An unknown error occurred");
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

app.get("/login", async (req, res) => {
	return renderPage("login.html"); // example
});

app.post("/login", async (req, res) => {
	const { username, password } = req.body;
	// basic check
	if (
		typeof username !== "string" ||
		username.length < 1 ||
		username.length > 31
	) {
		return res.status(400).send("Invalid username");
	}
	if (
		typeof password !== "string" ||
		password.length < 1 ||
		password.length > 255
	) {
		return res.status(400).send("Invalid password");
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
		const authRequest = auth.handleRequest(req, res);
		authRequest.setSession(session);
		// redirect to profile page
		return res.status(302).setHeader("Location", "/").end();
	} catch (e) {
		// check for unique constraint error in user table
		if (
			e instanceof LuciaError &&
			(e.message === "AUTH_INVALID_KEY_ID" ||
				e.message === "AUTH_INVALID_PASSWORD")
		) {
			// user does not exist
			// or invalid password
			return res.status(400).send("Incorrect username or password");
		}

		return res.status(500).send("An unknown error occurred");
	}
});
```

## Get authenticated user

You can validate requests and get the current session/user by either using [`AuthRequest.validate()`](/reference/lucia/interfaces/authrequest#validate) for session cookies, and [`AuthRequest.validateBearerToken()`](/reference/lucia/interfaces/authrequest#validatebearertoken) for session ids sent via the authorization header as a `Bearer` token. Both of these method returns a [`Session`](/reference/lucia/interfaces#session) if the user is authenticated or `null` if not.

You can see that `User.username` exists because we defined it with `getUserAttributes()` configuration.

```ts
get("/user", async (req, res) => {
	const authRequest = auth.handleRequest(req, res);
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

app.post("/logout", async (req, res) => {
	const authRequest = auth.handleRequest(req, res);
	const session = await authRequest.validate(); // or `authRequest.validateBearerToken()`
	if (!session) {
		return res.sendStatus(401);
	}
	await auth.invalidateSession(session.sessionId);

	authRequest.setSession(null); // for session cookie

	// redirect back to login page
	return res.status(302).setHeader("Location", "/login").end();
});
```
