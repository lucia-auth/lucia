---
title: "Sign in with username and password in Astro"
menuTitle: "Astro"
description: "Learn the basic of Lucia by implementing a basic username and password authentication in Astro"
---

_Before starting, make sure you've [setup Lucia and your database](/start-here/getting-started/astro) and that you've implement the recommended middleware._

This guide will cover how to implement a simple username and password authentication using Lucia in Astro. It will have 3 parts:

- A sign up page
- A sign in page
- A profile page with a logout button

### Clone project

You can get started immediately by cloning the [Astro example](https://github.com/pilcrowOnPaper/lucia/tree/main/examples/astro/username-and-password) from the repository.

```
npx degit pilcrowonpaper/lucia/examples/astro/username-and-password <directory_name>
```

Alternatively, you can [open it in StackBlitz](https://stackblitz.com/github/pilcrowOnPaper/lucia/tree/main/examples/astro/username-and-password).

## Update your database

Add a `username` column to your table. It should be a `string` (`TEXT`, `VARCHAR` etc) type that's unique.

Make sure you update `Lucia.DatabaseUserAttributes` in `env.d.ts` whenever you add any new columns to the user table.

```ts
// src/env.d.ts
/// <reference types="lucia" />
declare namespace Lucia {
	type Auth = import("./lib/lucia").Auth;
	type DatabaseUserAttributes = {
		username: string;
	};
	type DatabaseSessionAttributes = {};
}
```

## Configure Lucia

We'll expose the user's username to the `User` object by defining [`getUserAttributes`](/basics/configuration#getuserattributes).

```ts
// src/lib/lucia.ts
import { lucia } from "lucia";
import { astro } from "lucia/middleware";

export const auth = lucia({
	adapter: ADAPTER,
	env: import.meta.env.DEV ? "DEV" : "PROD",
	middleware: astro(),

	getUserAttributes: (data) => {
		return {
			username: data.username
		};
	}
});

export type Auth = typeof auth;
```

## Sign up page

Create `pages/signup.astro` and a form with inputs for username and password

```astro
---
// src/pages/signup.astro
---

<html lang="en">
	<head>
		<meta charset="utf-8" />
		<meta name="viewport" content="width=device-width" />
		<meta name="generator" content={Astro.generator} />
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

The form submission can be handled within the same Astro page.

Users can be created with [`Auth.createUser()`](/reference/lucia/interfaces/auth#createuser). This will create a new user, and if `key` is defined, a new key. The key here defines the connection between the user and the provided unique username (`providerUserId`) when using the username & password authentication method (`providerId`). We'll also store the password in the key. This key will be used get the user and validate the password when logging them in. The type for `attributes` property is `Lucia.DatabaseUserAttributes`, which we added `username` to previously.

After successfully creating a user, we'll create a new session with [`Auth.createSession()`](/reference/lucia/interfaces/auth#createsession) and store it as a cookie with [`AuthRequest.setSession()`](/reference/lucia/interfaces/authrequest#setsession). Since we've setup middleware, `AuthRequest` is accessible as `Astro.locals.auth`.

```astro
---
// src/pages/signup.astro
import { auth } from "../lib/lucia";

let errorMessage: string | null = null;

// check for form submissions
if (Astro.request.method === "POST") {
	const formData = await Astro.request.formData();
	const username = formData.get("username");
	const password = formData.get("password");
	// basic check
	const validUsername =
		typeof username === "string" &&
		username.length >= 4 &&
		username.length <= 31;
	const validPassword =
		typeof password === "string" &&
		password.length >= 6 &&
		password.length <= 255;
	if (validUsername && validPassword) {
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
			Astro.locals.auth.setSession(session); // set session cookie
			return Astro.redirect("/", 302); // redirect to profile page
		} catch (e) {
			// this part depends on the database you're using
			// check for unique constraint error in user table
			if (
				e instanceof SomeDatabaseError &&
				e.message === USER_TABLE_UNIQUE_CONSTRAINT_ERROR
			) {
				errorMessage = "Username already taken";
			} else {
				errorMessage = "An unknown error occurred";
			}
		}
	} else {
		errorMessage = "Invalid input";
	}
}
---
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

Authenticated users should be redirected to the profile page whenever they try to access the sign up page. You can validate requests by creating a new [`AuthRequest` instance](/reference/lucia/interfaces/authrequest) with [`Auth.handleRequest()`](/reference/lucia/interfaces/auth#handlerequest), which is stored as `Astro.locals.auth`, and calling [`AuthRequest.validate()`](/reference/lucia/interfaces/authrequest#validate). This method returns a [`Session`](/reference/lucia/interfaces#session) if the user is authenticated or `null` if not.

```astro
---
// src/pages/signup.astro
import { auth } from "../lib/lucia";

if (Astro.request.method === "POST") {
	// ...
}

const session = await Astro.locals.auth.validate();
if (session) return Astro.redirect("/", 302); // redirect to profile page
---
```

## Sign in page

Create `src/pages/login.astro` and also add a form with inputs for username and password

```astro
---
// src/pages/login.astro
---

<html lang="en">
	<head>
		<meta charset="utf-8" />
		<meta name="viewport" content="width=device-width" />
		<meta name="generator" content={Astro.generator} />
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

This will be handled in a POST endpoint.

The key we created for the user allows us to get the user via their username, and validate their password. This can be done with [`Auth.useKey()`](/reference/lucia/interfaces/auth#usekey). If the username and password is correct, we'll create a new session just like we did before. If not, Lucia will throw an error. Make sure to make the username lowercase before calling `useKey()`.

```astro
---
// src/pages/login.astro
import { auth } from "../lib/lucia";
import { LuciaError } from "lucia";

let errorMessage: string | null = null;

// check for form submissions
if (Astro.request.method === "POST") {
	const formData = await Astro.request.formData();
	const username = formData.get("username");
	const password = formData.get("password");
	// basic check
	const validUsername =
		typeof username === "string" &&
		username.length >= 4 &&
		username.length <= 31;
	const validPassword =
		typeof password === "string" &&
		password.length >= 6 &&
		password.length <= 255;
	if (validUsername && validPassword) {
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
			Astro.locals.auth.setSession(session); // set session cookie
			return Astro.redirect("/", 302); // redirect to profile page
		} catch (e) {
			if (
				e instanceof LuciaError &&
				(e.message === "AUTH_INVALID_KEY_ID" ||
					e.message === "AUTH_INVALID_PASSWORD")
			) {
				// user does not exist
				// or invalid password
				errorMessage = "Incorrect username of password";
			} else {
				errorMessage = "An unknown error occurred";
			}
		}
	} else {
		errorMessage = "Invalid input";
	}
}
---
```

### Redirect authenticated users

As we did in the sign up page, redirect authenticated users to the profile page.

```astro
---
// src/pages/login.astro
import { auth } from "../lib/lucia";

if (Astro.request.method === "POST") {
	// ...
}

const session = await Astro.locals.auth.validate();
if (session) return Astro.redirect("/", 302); // redirect to profile page
---
```

## Profile page

Create `src/pages/index.astro`. This page will show some basic user info and include a logout button.

Unauthenticated users should be redirected to the login page. The user object is available in `Session.user`, and you'll see that `User.username` exists because we defined it in first step with `getUserAttributes()` configuration.

```astro
---
// src/pages/index.astro
const session = await Astro.locals.auth.validate();
if (!session) return Astro.redirect("/login", 302);
---

<html lang="en">
	<head>
		<meta charset="utf-8" />
		<meta name="viewport" content="width=device-width" />
		<meta name="generator" content={Astro.generator} />
	</head>
	<body>
		<h1>Profile</h1>
		<p>User id: {session.user.userId}</p>
		<p>Username: {session.user.username}</p>
		<form method="post" action="/logout">
			<input type="submit" value="Sign out" />
		</form>
	</body>
</html>
```

### Sign out users

Create `src/pages/logout.ts` and handle POST requests.

When logging out users, it's critical that you invalidate the user's session. This can be achieved with [`Auth.invalidateSession()`](/reference/lucia/interfaces/auth#invalidatesession). You can delete the session cookie by overriding the existing one with a blank cookie that expires immediately. This can be done by passing `null` to `AuthRequest.setSession()`.

```ts
// src/pages/logout.ts
import { auth } from "../lib/lucia";

import type { APIRoute } from "astro";

export const post: APIRoute = async (context) => {
	const session = await context.locals.auth.validate();
	if (!session) {
		return new Response("Not authenticated", {
			status: 401
		});
	}
	// make sure to invalidate the current session!
	await auth.invalidateSession(session.sessionId);
	// delete session cookie
	context.locals.auth.setSession(null);
	return context.redirect("/login", 302);
};
```
