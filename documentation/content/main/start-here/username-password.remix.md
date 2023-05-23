---
_order: 2
title: "Username/password example"
description: "Learn how to use Lucia in Remix by implementing a basic username/password auth"
---

This page will guide you how to implement a simple username/password authentication using Remix and cover the basics of Lucia.

Start off by following the steps in the [previous page](/start-here/getting-started?remix) to set up Lucia and your database.

### Clone example project

You can also clone the [Remix example](https://github.com/pilcrowOnPaper/lucia/tree/main/examples/remix), which uses SQLite + Prisma. Clone it locally with a single command:

```
npx degit pilcrowonpaper/lucia/examples/remix <project_name>
```

Alternatively, you can [open it in StackBlitz](https://stackblitz.com/github/pilcrowOnPaper/lucia/tree/main/examples/remix).

## 1. Configure your database

As an example, we'll add a `username` column to the `user` table. The `username` column will be later used as an identifier for creating new users, but you could replace it with `email`, for example.

| name     | type   | unique | description          |
| -------- | ------ | :----: | -------------------- |
| username | string |   ✓    | username of the user |

## 2. Configure Lucia

In `lucia.d.ts`, add `username` in `UserAttributes` since we added `username` column to `user` table:

```ts
// lucia.d.ts
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
// auth/lucia.server.ts
export const auth = lucia({
	adapter: prisma(),
	env: "DEV" // "PROD" if prod,
	middleware: node(),
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

Create `app/routes/signup.tsx`. This page will handle account creation. Add an input field for username and password to the form.

```tsx
// app/routes/signup.tsx
import { Form } from "@remix-run/react";

export default () => {
	return (
		<>
			<h2>Create an account</h2>
			<Form method="post">
				<label htmlFor="username">username</label>
				<br />
				<input id="username" name="username" />
				<br />
				<label htmlFor="password">password</label>
				<br />
				<input type="password" id="password" name="password" />
				<br />
				<input type="submit" value="Continue" />
			</Form>
			<a href="/login">Sign in</a>
		</>
	);
};
```

### Create users

Define an `action()`.

Calling [`handleRequest()`] will create a new [`AuthRequest`](/reference/lucia-auth/authrequest) instance, which makes it easier to handle sessions and cookies. This can be initialized with `Request` and `Headers`.

Users can be created with `createUser()`. This will create a new primary key that can be used to authenticate user as well. We’ll use `"username"` as the provider id (authentication method) and the username as the provider user id (something unique to the user). Create a new session with [`createSession()`](/reference/lucia-auth/auth?nextjs#createsession) and make sure to store the session id by calling [`setSession()`](/reference/lucia-auth/authrequest#setsession).

```tsx
// app/routes/signup.tsx
import { Form } from "@remix-run/react";
import { auth } from "@auth/lucia.server";
import { LuciaError } from "lucia-auth";
import { redirect, json } from "@remix-run/node";
import { Prisma } from "@prisma/client";

import type { LoaderArgs } from "@remix-run/node";

export default () => {
	// ...
};

export const action = async ({ request }: ActionArgs) => {
	const formData = await request.formData();
	const username = formData.get("username");
	const password = formData.get("password");
	if (
		!username ||
		!password ||
		typeof username !== "string" ||
		typeof password !== "string"
	) {
		return json(null, {
			status: 400
		});
	}
	const headers = new Headers();
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
		const authRequest = auth.handleRequest(request, headers);
		authRequest.setSession(session);
		return redirect("/", {
			headers // IMPORTANT!
		});
	} catch (error) {
		// username taken
		console.error(error);
		return json(null, {
			status: 500,
			headers // IMPORTANT!
		});
	}
};
```

#### Handle requests

Calling [`handleRequest()`] will create a new [`AuthRequest`](/reference/lucia-auth/authrequest) instance, which makes it easier to handle sessions and cookies. This can be initialized with `Request` and `Headers`. **When returning a response, you must set the `headers` you pass onto `handleRequest()`.**

In this case, we don't need to validate the request, but we do need it for setting the session cookie with [`AuthRequest.setSession()`](/reference/lucia-auth/authrequest#setsession).

```ts
const authRequest = auth.handleRequest(request, headers);
```

> (warn) Remix does not check for [cross site request forgery (CSRF)](https://owasp.org/www-community/attacks/csrf) on API requests. While `AuthRequest.validateUser()` will do a CSRF check and only return a user/session if it passes the check, **make sure to add CSRF protection** to routes that doesn't rely on Lucia for validation. You can check if the request is coming from the same domain as where the app is hosted by using the `Origin` header.

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

Define a `loader()`.

[`AuthRequest.validateUser()`](/reference/lucia-auth/authrequest#validate) can be used to validate the request and get the current session and user.

```tsx
// app/routes/signup.tsx
import { Form } from "@remix-run/react";
import { auth } from "@auth/lucia.server";
import { LuciaError } from "lucia-auth";
import { redirect, json } from "@remix-run/node";

import type { LoaderArgs, ActionArgs } from "@remix-run/node";

export default () => {
	// ...
};

export const loader = async ({ request }: LoaderArgs) => {
	const headers = new Headers();
	const authRequest = auth.handleRequest(request, headers);
	const { session } = await authRequest.validateUser();
	if (session) return redirect("/");
	return json(null, {
		headers // IMPORTANT!
	});
};

export const action = async ({ request }: ActionArgs) => {
	// ...
};
```

## 4. Sign in page

### Sign in form

Create `app/routes/login.tsx`. This route will handle sign ins. Add an input field for username and password to the form.

```tsx
// app/routes/login.tsx
import { Form } from "@remix-run/react";

export default () => {
	const actionResult = useActionData<typeof action>();
	return (
		<>
			<h2>Sign in</h2>
			<Form method="post">
				<label htmlFor="username">username</label>
				<br />
				<input id="username" name="username" />
				<br />
				<label htmlFor="password">password</label>
				<br />
				<input type="password" id="password" name="password" />
				<br />
				<input type="submit" value="Continue" />
			</Form>
			<a href="/signup">Create a new account</a>
		</>
	);
};
```

### Authenticate users

Create `pages/api/login.ts`. This API route will handle sign-ins.

We’ll use the key created in the previous section to reference the user and authenticate them by validating the password with [`useKey()`](/reference/lucia-auth/auth#usekey) . Create a new session if the password is valid.

```tsx
// pages/api/login.ts
import { Form } from "@remix-run/react";
import { auth } from "@auth/lucia.server";
import { LuciaError } from "lucia-auth";
import { redirect, json } from "@remix-run/node";
import { Prisma } from "@prisma/client";

import type { LoaderArgs } from "@remix-run/node";

export default () => {
	// ...
};

export const action = async ({ request }: ActionArgs) => {
	const formData = await request.formData();
	const username = formData.get("username");
	const password = formData.get("password");
	if (
		!username ||
		!password ||
		typeof username !== "string" ||
		typeof password !== "string"
	) {
		return json(null, {
			status: 400
		});
	}
	const headers = new Headers();
	try {
		const key = await auth.useKey("username", username, password);
		const session = await auth.createSession(key.userId);
		const authRequest = auth.handleRequest(request, headers);
		authRequest.setSession(session);
		return redirect("/", {
			headers // IMPORTANT!
		});
	} catch (error) {
		// invalid username/password
		console.error(error);
		return json(null, {
			status: 500,
			headers // IMPORTANT!
		});
	}
};
```

#### Validating passwords

We want to reference the key we created for the user in the previous step, so "username" will be the provider id and the username will be the provider user id. `useKey()` will throw an error if the key doesn't exist or if the password is incorrect.

```ts
const key = await auth.useKey("username", username, password);
```

### Redirect authenticated users

If the session exists, redirect authenticated users to the profile page.

```tsx
// app/routes/login.tsx
import { Form } from "@remix-run/react";
import { auth } from "@auth/lucia.server";
import { LuciaError } from "lucia-auth";
import { redirect, json } from "@remix-run/node";

import type { LoaderArgs, ActionArgs } from "@remix-run/node";

export default () => {
	// ...
};

export const loader = async ({ request }: LoaderArgs) => {
	const headers = new Headers();
	const authRequest = auth.handleRequest(request, headers);
	const { session } = await authRequest.validateUser();
	if (session) return redirect("/");
	return json(null, {
		headers // IMPORTANT!
	});
};

export const action = async ({ request }: ActionArgs) => {
	// ...
};
```

## 5. Profile page (protected)

This page will be the root page (`/`). This route will show the user's data and have the note-taking portion of the app.

### Get current user

Create `app/routes/_index.tsx`. Redirect the user to `/login` if they are unauthenticated. It will include a form for logging out.

```tsx
// app/routes/_index.ts
import { auth } from "@auth/lucia.server";
import { Form, useLoaderData } from "@remix-run/react";
import { redirect, json } from "@remix-run/node";

import type { LoaderArgs, ActionArgs } from "@remix-run/node";

export default () => {
	const loaderData = useLoaderData<typeof loader>();
	return (
		<>
			<h1>Profile</h1>
			<div>
				<p>User id: {loaderData.userId}</p>
				<p>Username: {loaderData.username}</p>
			</div>
			<Form method="post">
				<input type="submit" value="Sign out" />˝
			</Form>
		</>
	);
};

export const loader = async ({ request }: LoaderArgs) => {
	const headers = new Headers();
	const authRequest = auth.handleRequest(request, headers);
	const { user } = await authRequest.validateUser();
	if (!user) return redirect("/login");
	return json(
		{ user },
		{
			headers // IMPORTANT!
		}
	);
};
```

### Sign out

Define an `action()` to handle sign outs, which can be done by invalidating the current session and removing the session cookie..

```tsx
import { auth } from "@auth/lucia.server";
import { Form, useLoaderData } from "@remix-run/react";
import { redirect, json } from "@remix-run/node";

import type { LoaderArgs, ActionArgs } from "@remix-run/node";

export default () => {
	// ...
};

export const loader = async ({ request }: LoaderArgs) => {
	// ...
};

export const action = async ({ request }: ActionArgs) => {
	const headers = new Headers();
	const authRequest = auth.handleRequest(request, headers);
	const { session } = await authRequest.validateUser();
	if (!session) {
		return json(null, {
			status: 401,
			headers
		});
	}
	await auth.invalidateSession(session.sessionId); // invalidate session
	authRequest.setSession(null); // delete cookie
	return redirect("/login", {
		headers // IMPORTANT!
	});
};
```
