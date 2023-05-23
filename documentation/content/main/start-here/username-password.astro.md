---
_order: 2
title: "Username/password example"
description: "Learn how to use Lucia in Astro by implementing a basic username/password auth"
---

This page will guide you how to implement a simple username/password authentication using Astro and cover the basics of Lucia.

Start off by following the steps in the [previous page](/start-here/getting-started?astro) to set up Lucia and your database.

### Clone example project

You can also clone the [Astro example](https://github.com/pilcrowOnPaper/lucia/tree/main/examples/astro), which uses SQLite + Prisma. Clone it locally with a single command:

```
npx degit pilcrowonpaper/lucia/examples/astro <project_name>
```

Alternatively, you can [open it in StackBlitz](https://stackblitz.com/github/pilcrowOnPaper/lucia/tree/main/examples/astro).

## 1. Configure your database

As an example, we'll add a `username` column to the `user` table. The `username` column will be later used as an identifier for creating new users, but you could replace it with `email`, for example.

| name     | type   | unique | description          |
| -------- | ------ | :----: | -------------------- |
| username | string |   ✓    | username of the user |

## 2. Configure Lucia

In `src/lucia.d.ts`, add `username` in `UserAttributes` since we added `username` column to `user` table:

```ts
// src/lucia.d.ts
/// <reference types="lucia-auth" />
declare namespace Lucia {
	type Auth = import("$lib/server/lucia.js").Auth;
	type UserAttributes = {
		username: string;
	};
}
```

Add [`transformDatabaseUser()`](/basics/configuration#transformuserdata) to your Lucia config to expose the user's id and username (by default only `userId` is added). The returned value will be the `User` object.

```ts
// lib/lucia.ts
export const auth = lucia({
	adapter: prisma(),
	env: import.meta.env.DEV ? "DEV" : "PROD",
	middleware: astro(),
	transformDatabaseUser: (userData) => {
		return {
			userId: userData.id,
			username: userData.username
		};
	}
});
```

## 3. Sign up page

### Sign up form

Create `pages/signup.astro`. This form will have an input field for username and password.

```astro
<h1>Create an account</h1>
<form method="post">
	<label for="username">username</label><br />
	<input id="username" name="username" /><br />
	<label for="password">password</label><br />
	<input type="password" id="password" name="password" /><br />
	<input type="submit" value="Continue" />
</form>
```

### Creating users

In the same page, we'll also handle the POST request from the form.

Users and keys can be created with [`createUser()`](/reference/lucia-auth/auth#createuser). Create a new session with [`createSession()`](/reference/lucia-auth/auth?astro#createsession) and make sure to store the session id by calling [`AuthRequest.setSession()`](/reference/lucia-auth/authrequest#setsession).

```astro
---
// pages/signup.astro
import { auth } from "../lib/lucia";

const authRequest = auth.handleRequest(Astro);

if (Astro.request.method === "POST") {
	// csrf check
	const requestOrigin = Astro.request.headers.get("origin");
	const isValidRequest = !!requestOrigin && requestOrigin === Astro.url.origin;
	if (!isValidRequest) {
		return new Response(null, {
			status: 403
		});
	}
	const form = await Astro.request.formData();
	const username = form.get("username");
	const password = form.get("password");
	// check for empty values
	if (typeof username === "string" && typeof password === "string") {
		try {
			const user = await auth.createUser({
				primaryKey: {
					providerId: "username",
					providerUserId: username,
					password
				},
				attributes: {
					username
				}
			});
			const session = await auth.createSession(user.userId);
			authRequest.setSession(session); // set session cookie
			return Astro.redirect("/", 302); // redirect on successful attempt
		} catch {
			// username taken
			Astro.response.status = 400;
		}
	} else {
		Astro.response.status = 400;
	}
}
---
```

#### Handle requests

Calling [`handleRequest()`] will create a new [`AuthRequest`](/reference/lucia-auth/authrequest) instance, which makes it easier to handle sessions and cookies. This can be initialized with the [`Astro`](https://docs.astro.build/en/reference/api-reference/#astro-global) global when using the Astro middleware.

In this case, we don't need to validate the request, but we do need it for setting the session cookie.

```ts
const authRequest = auth.handleRequest(Astro);
```

> (warn) Astro does not check for [cross site request forgery (CSRF)](https://owasp.org/www-community/attacks/csrf) on API requests. While `AuthRequest.validateUser()` will do a CSRF check and only return a user/session if it passes the check, **make sure to add CSRF protection** to routes that doesn't rely on Lucia for validation. You can check if the request is coming from the same domain as where the app is hosted by using the `Origin` header.

#### Set user passwords

We don't store the password in the user, but in the key (`primaryKey`). Keys represent the relationship between a user and a auth method, in this case username/password. We'll set `"username"` as the provider id (authentication method) and the username as the provider user id (something unique to the user).

```ts
const user = await auth.createUser({
	primaryKey: {
		providerId: "username",
		providerUserId: username,
		password
	}
	// ...
});
```

### Redirect authenticated users

[`AuthRequest.validateUser()`](/reference/lucia-auth/authrequest#validate) can be used to validate the request and get the current session and user.

```astro
---
// pages/signup.astro
import { auth } from "../lib/lucia";

const authRequest = auth.handleRequest(Astro);
const { session } = await authRequest.validateUser();
if (session) {
	return Astro.redirect("/", 302); // redirect to profile page if authenticated
}

if (Astro.request.method === "POST") {
	// ...
}
---
```

## 4. Sign in page

### Sign in form

Create `pages/login.astro`. This route will handle sign ins using a form, which will also have an input field for username and password.

```astro
<h1>Sign in</h1>
<form method="post">
	<label for="username">username</label><br />
	<input id="username" name="username" /><br />
	<label for="password">password</label><br />
	<input type="password" id="password" name="password" /><br />
	<input type="submit" value="Continue" />
</form>
```

### Authenticate users

The same page will also handle form submissions.

We’ll use the key created in the previous section to reference the user and authenticate them by validating the password with [`useKey()`](/reference/lucia-auth/auth#usekey) . Create a new session if the password is valid.

```astro
---
// pages/login.astro
import { auth } from "../lib/lucia";

const authRequest = auth.handleRequest(Astro);

// redirect to profile page if authenticated
const { session } = await authRequest.validateUser();
if (session) {
	return Astro.redirect("/", 302);
}

if (Astro.request.method === "POST") {
	// csrf check
	const requestOrigin = Astro.request.headers.get("origin");
	const isValidRequest = !!requestOrigin && requestOrigin === Astro.url.origin;
	if (!isValidRequest) {
		return new Response(null, {
			status: 403
		});
	}
	const form = await Astro.request.formData();
	const username = form.get("username");
	const password = form.get("password");
	// check for empty values
	if (typeof username === "string" && typeof password === "string") {
		try {
			const key = await auth.useKey("username", username, password);
			const session = await auth.createSession(key.userId);
			authRequest.setSession(session);
			return Astro.redirect("/", 302); // redirect on successful attempt
		} catch {
			// invalid username/password
			Astro.response.status = 400;
		}
	} else {
		Astro.response.status = 400;
	}
}
---
```

#### Validating passwords

We want to reference the key we created for the user in the previous step, so "username" will be the provider id and the username will be the provider user id. `useKey()` will throw an error if the key doesn't exist or if the password is incorrect.

```ts
const key = await auth.useKey("username", username, password);
```

## 5. Profile page (protected)

This page will be the root page (`/`). This route will display the user's data.

### Get current user

Create `pages/index.astro` and redirect unauthenticated user to the login page.

```astro
---
// pages/index.astro
import { auth } from "../lib/lucia";

const authRequest = auth.handleRequest(Astro);
const { user } = await authRequest.validateUser();

if (!user) {
	return Astro.redirect("/login", 302);
}
---

<h1>Profile</h1>
<div>
	<p>User id: {user.userId}</p>
	<p>Username: {user.username}</p>
</div>
```

### Sign out users

Create a POST endpoint in `api/logout` that handles logout. It will invalidate the current session and remove the session cookie.

```ts
// pages/api/logout.ts
import { auth } from "../../lib/lucia";
import type { APIRoute } from "astro";

export const post: APIRoute = async (Astro) => {
	const authRequest = auth.handleRequest(Astro);
	const { session } = await authRequest.validateUser();
	if (!session) {
		return new Response(null, {
			status: 400
		});
	}
	await auth.invalidateSession(session.sessionId); // invalidate current session
	authRequest.setSession(null); // clear session cookie

	// redirect to login page
	return new Response(null, {
		status: 302,
		headers: {
			location: "/login"
		}
	});
};
```

In the frontend, create a new form that sends a POST request to the endpoint. Authenticated users will be signed out on submission.

```html
<form action="/api/logout" method="post">
	<input type="submit" value="Sign out" />
</form>
```

## 6. Validate requests

`AuthRequest` can be used inside API routes as well:

```ts
// pages/api/index.ts
import { auth } from "../../lib/lucia";
import type { APIRoute } from "astro";

export const get: APIRoute = async (context) => {
	const authRequest = auth.handleRequest(context);
	// ...
};

export const post: APIRoute = async (context) => {
	const authRequest = auth.handleRequest(context);
	// ...
};
```
