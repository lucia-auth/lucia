---
_order: 2
title: "Username/password example"
description: "Learn how to use Lucia by implementing a basic username/password auth"
---

This page will guide you how to implement a simple username/password authentication and cover the basics of Lucia. This guide will not use any JS in the frontend, and uses the standard `Request`/`Response` for handling requests.

Start off by following the steps in the [previous page](/start-here/getting-started) to set up Lucia and your database.

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
	env: "DEV" // "PROD" if prod,
	middleware: web(),
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

Create `/signup` page. This form will have an input field for username and password.

```html
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

Users and keys can be created with [`createUser()`](/reference/lucia-auth/auth#createuser). Create a new session with [`createSession()`](/reference/lucia-auth/auth#createsession) and make sure to store the session id by calling [`AuthRequest.setSession()`](/reference/lucia-auth/authrequest#setsession).

```ts
// /signup
import { auth } from "../lib/lucia";

const handleRequest = async (request) => {
	const headers = new Headers();
	const authRequest = auth.handleRequest(request, headers);

	if (Astro.request.method === "POST") {
		// csrf check
		const requestOrigin = request.headers.get("origin");
		const url = new URL(request.url);
		const isValidRequest = !!requestOrigin && requestOrigin === url.origin;
		if (!isValidRequest) {
			return new Response(null, {
				status: 403,
				headers // important
			});
		}
		const form = await request.formData();
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
				// redirect on successful attempt
				headers.set("location", "/");
				return new Response(null, {
					status: 302,
					headers // important!
				});
			} catch {
				// username already in use
			}
		} else {
			// invalid form
		}
	}
	// render page
	return new Response(html, {
		// ...
		headers // important!
	});
};
```

#### Handle requests

Calling [`handleRequest()`](/reference/lucia-auth/auth#handlerequest) will create a new [`AuthRequest`](/reference/lucia-auth/authrequest) instance, which makes it easier to handle sessions and cookies. This can be initialized with the standard [`Request`](https://www.google.com/search?client=safari&rls=en&q=mdn+request&ie=UTF-8&oe=UTF-8) and [`Headers`](https://developer.mozilla.org/en-US/docs/Web/API/Headers) when using the Web middleware.

In this case, we don't need to validate the request, but we do need it for setting the session cookie.

```ts
const authRequest = auth.handleRequest(request, headers);
```

**Make sure you're setting headers provided to `handleRequest()` when returning a response.** Your users may be sign out if you omit it.

```ts
return new Response(null, {
	status: 302,
	headers
});
```

> (warn) While `AuthRequest.validateUser()` will do a CSRF check and only return a user/session if it passes the check, **make sure to add CSRF protection** to routes that doesn't rely on Lucia for validation. You can check if the request is coming from the same domain as where the app is hosted by using the `Origin` header.

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

> (warn) In an actual production code, you want to make sure you check for password strength. See the checklist in the [OWASP Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html#implement-proper-password-strength-controls).

### Redirect authenticated users

[`AuthRequest.validateUser()`](/reference/lucia-auth/authrequest#validate) can be used to validate the request and get the current session and user.

```ts
import { auth } from "../lib/lucia";

export const handleRequest = async (request) => {
	const headers = new Headers();
	const authRequest = auth.handleRequest(request, headers);
	const { session } = await authRequest.validateUser();
	if (session) {
		headers.set("location", "/");
		return new Response(null, {
			status: 302,
			headers //important!
		});
	}

	if (request.method === "POST") {
		// ...
	}
};
```

## 4. Sign in page

### Sign in form

Create `/login` page. This route will handle sign ins using a form, which will also have an input field for username and password.

```html
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

```ts
// /login
import { auth } from "../lib/lucia";

const handleRequest = async (request) => {
	const headers = new Headers();
	const authRequest = auth.handleRequest(request, headers);

	// redirect to profile page if authenticated
	const { session } = await authRequest.validateUser();
	if (session) {
		headers.set("location", "/");
		return new Response(null, {
			status: 302,
			headers // important!
		});
	}

	if (request.method === "POST") {
		// csrf check
		const requestOrigin = request.headers.get("origin");
		const isValidRequest =
			!!requestOrigin && requestOrigin === Astro.url.origin;
		if (!isValidRequest) {
			return new Response(null, {
				status: 403,
				headers // important!
			});
		}
		const form = await request.formData();
		const username = form.get("username");
		const password = form.get("password");
		// check for empty values
		if (typeof username === "string" && typeof password === "string") {
			try {
				const key = await auth.useKey("username", username, password);
				const session = await auth.createSession(key.userId);
				authRequest.setSession(session);
				// redirect on successful attempt
				// redirect on successful attempt
				headers.set("location", "/");
				return new Response(null, {
					status: 302,
					headers // important!
				});
			} catch {
				// invalid username/password
			}
		} else {
			// invalid form
		}
	}
	// render page
	return new Response(html, {
		// ...
		headers // important!
	});
};
```

#### Validating passwords

We want to reference the key we created for the user in the previous step, so "username" will be the provider id and the username will be the provider user id. `useKey()` will throw an error if the key doesn't exist or if the password is incorrect.

```ts
const key = await auth.useKey("username", username, password);
```

## 5. Profile page (protected)

This page will be the root page (`/`). This route will show the user's data and have the note-taking portion of the app.

### Get current user

Redirect unauthenticated users to the login page.

```ts
// /index
import { auth } from "../lib/lucia";

export const handleRequest = async (request) => {
	const headers = new Headers();
	const authRequest = auth.handleRequest(request, headers);
	const { user } = await authRequest.validateUser();

	if (!user) {
		// redirect to login page
		headers.set("location", "/login");
		return new Response(null, {
			status: 302,
			headers // important!
		});
	}
	// render page
	return new Response(html, {
		headers // important!
	});
};
```

### Sign out users

Create a POST endpoint in `api/logout` that handles logout. It will invalidate the current session and remove the session cookie.

```ts
// /api/logout
import { auth } from "../../lib/lucia";

export const handleRequest = async (request) => {
	const headers = new Headers();
	const authRequest = auth.handleRequest(request, headers);
	const { session } = await authRequest.validateUser();
	if (!session)
		return new Response(null, {
			status: 400,
			headers // important!
		});
	await auth.invalidateSession(session.sessionId); // invalidate current session
	authRequest.setSession(null); // clear session cookie

	// redirect to login page
	headers.set("location", "/login");
	return new Response(null, {
		status: 302,
		headers // important!
	});
};
```

In the frontend, create a new form that sends a POST request to the endpoint. Authenticated users will be signed out on submission.

```html
<form action="/api/logout" method="post">
	<input type="submit" value="Sign out" />
</form>
```
