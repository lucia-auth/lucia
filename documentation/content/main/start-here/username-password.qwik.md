---
_order: 2
title: "Username/password example"
description: "Learn how to use Lucia in Qwik by implementing a basic username/password auth"
---

This page will guide you how to implement a simple username/password auth and cover the basics of Lucia.

Start off by following the steps in the [previous page](/start-here/getting-started?qwik) to set up Lucia and your database.

### Clone example project

You can also clone the [Qwik example](https://github.com/pilcrowOnPaper/lucia/tree/main/examples/qwik), which uses SQLite + Prisma. Clone it locally with a single command:

```
npx degit pilcrowonpaper/lucia/examples/qwik <project_name>
```

Alternatively, you can [open it in StackBlitz](https://stackblitz.com/github/pilcrowOnPaper/lucia/tree/main/examples/qwik).

## 1. Configure your database

As an example, we'll add a `username` column to the `user` table. The `username` column will be later used as an identifier for creating new users, but you could replace it with `email`, for example.

| name     | type   | unique | description          |
| -------- | ------ | :----: | -------------------- |
| username | string |   ✓    | username of the user |

## 2. Configure Lucia

In `lucia.d.ts`, add `username` in `UserAttributes` since we added `username` column to `user` table:

```ts
// src/lucia.d.ts
/// <reference types="lucia-auth" />
declare namespace Lucia {
	type Auth = import("./lib/lucia.js").Auth;
	type UserAttributes = {
		username: string;
	};
}
```

Add [`transformDatabaseUser()`](/basics/configuration#transformuserdata) to your Lucia config to expose the user's id and username (by default only `userId` is added). The returned value will be the `User` object.

```ts
// src/lib/lucia.ts
export const auth = lucia({
	adapter: prisma(),
	env: "DEV", // "PROD" if prod
	middleware: qwik(),
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

Create `src/routes/signup/index.tsx`. This form will have an input field for username and password.

```tsx
// src/routes/signup/index.tsx

import { component$ } from "@builder.io/qwik";
import { Form, Link } from "@builder.io/qwik-city";

// create a component to render the form
export default component$(() => {
	return (
		<>
			<Form>
				<label for="username">username</label>

				<br />
				<input id="username" name="username" />

				<br />
				<label for="password">password</label>
				<br />
				<input type="password" id="password" name="password" />

				<br />
				<input type="submit" value="Continue" />
			</Form>

			<Link href="/login">Sign in</Link>
		</>
	);
});
```

### Handle form submission

We'll use [`routeAction$`](https://qwik.builder.io/docs/action/) to handle the form submission. This will be called when the form is submitted.

```tsx
// src/routes/signup/index.tsx
import { component$ } from "@builder.io/qwik";
import {
	Form,
	Link,
	routeAction$,
	routeLoader$,
	z,
	zod$
} from "@builder.io/qwik-city";
import { auth } from "~/lib/lucia";
import { Prisma } from "@prisma/client";
import { LuciaError } from "lucia-auth";

// create an action to handle the form submission
export const useSignupAction = routeAction$(
	async (values, event) => {
		try {
			const user = await auth.createUser({
				primaryKey: {
					providerId: "username",
					providerUserId: values.username,
					password: values.password
				},
				attributes: {
					username: values.username
				}
			});
			const { session } = await auth.createSession(user.userId);
			const authRequest = auth.handleRequest(event);
			authRequest.setSession(session);
		} catch (error) {
			// username already used
			console.error(error);
			return event.fail(400, {});
		}

		// if all goes well, redirect to home page
		throw event.redirect(302, "/");
	},
	zod$({
		username: z.string().min(3).max(20),
		password: z.string().min(6).max(20)
	})
);
```

#### Handle requests

Calling [`handleRequest()`] will create a new [`AuthRequest`](/reference/lucia-auth/authrequest) instance, which makes it easier to handle sessions and cookies. This can be initialized with [`IncomingMessage`](https://nodejs.org/api/http.html#class-httpincomingmessage) and [`OutgoingMessage`](https://nodejs.org/api/http.html#class-httpserverresponse).

In this case, we don't need to validate the request, but we do need it for setting the session cookie with [`AuthRequest.setSession()`](/reference/lucia-auth/authrequest#setsession).

```ts
const authRequest = auth.handleRequest(event);
```

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

### Add the action to the form

We'll add the action to the form

```tsx
export default component$(() => {
	const signupAction = useSignupAction();

	return (
		<>
			<Form action={signupAction}>
				<label for="username">username</label>

				<br />
				<input id="username" name="username" />

				<br />
				<label for="password">password</label>
				<br />
				<input type="password" id="password" name="password" />

				<br />
				<input type="submit" value="Continue" />
			</Form>

			<Link href="/login">Sign in</Link>
		</>
	);
});
```

### Redirect authenticated users

[`AuthRequest.validateUser()`](/reference/lucia-auth/authrequest#validate) can be used to validate the request and get the current session and user.

We'll use [`routeLoader$`](https://qwik.builder.io/docs/loader/) to make sure that the user is not already authenticated. If they are, we'll redirect them to the home page.

```tsx
// src/routes/signup/index.tsx
import { component$ } from "@builder.io/qwik";
import {
	Form,
	Link,
	routeAction$,
	routeLoader$,
	z,
	zod$
} from "@builder.io/qwik-city";
import { auth } from "~/lib/lucia";
import { Prisma } from "@prisma/client";
import { LuciaError } from "lucia-auth";

export const useUserLoader = routeLoader$(async (event) => {
	const authRequest = auth.handleRequest(event);
	const { session } = await authRequest.validateUser();
	if (session) throw event.redirect(302, "/");

	return {};
});

// ...
```

## 4. Sign in page

### Sign in form

Create `src/routes/login/index.tsx`. This route will handle sign ins. This form will also have an input field for username and password.

```tsx
// src/routes/login/index.tsx
import { component$ } from "@builder.io/qwik";
import { Link, Form } from "@builder.io/qwik-city";

// render the component
export default component$(() => {
	return (
		<>
			<h2>Sign in</h2>
			<Form>
				<label for="username">username</label>
				<br />
				<input id="username" name="username" />
				<br />
				<label for="password">password</label>
				<br />
				<input type="password" id="password" name="password" />
				<br />
				<button type="submit">Continue</button>
			</Form>
			<Link href="/signup">Create a new account</Link>
		</>
	);
});
```

### Authenticate users

We’ll use the key created in the previous section to reference the user and authenticate them by validating the password with [`useKey()`](/reference/lucia-auth/auth#usekey) . Create a new session if the password is valid.

We'll use [`routeAction$`](https://qwik.builder.io/docs/action/) to handle the form submission. This will be called when the form is submitted.

```tsx
// src/routes/login/index.tsx
import { component$ } from "@builder.io/qwik";
import {
	Form,
	Link,
	routeAction$,
	routeLoader$,
	z,
	zod$
} from "@builder.io/qwik-city";
import { auth } from "~/lib/lucia";
import { Prisma } from "@prisma/client";
import { LuciaError } from "lucia-auth";

// create an action to handle the form submission
export const useLoginAction = routeAction$(
	async (values, event) => {
		try {
			const authRequest = auth.handleRequest(event);
			const key = await auth.useKey(
				"username",
				values.username,
				values.password
			);

			const session = await auth.createSession(key.userId);
			authRequest.setSession(session);
		} catch (e) {
			// invalid username/password
			console.error(error);
			return event.fail(400, {});
		}

		// if all goes well, redirect to home page
		throw event.redirect(302, "/");
	},
	zod$({
		username: z.string().min(3),
		password: z.string().min(3)
	})
);

// ... the functional component shown above
```

#### Validating passwords

We want to reference the key we created for the user in the previous step, so "username" will be the provider id and the username will be the provider user id. `useKey()` will throw an error if the key doesn't exist or if the password is incorrect.

```ts
const key = await auth.useKey("username", username, password);
```

### Add the Login Action to the form

We can now add the `useLoginAction` to the form. This will be called when the form is submitted. Besides we can add the `useLoginAction.value?.failed` to show an error message if the login failed.

```tsx
// src/routes/login/index.tsx
import { component$ } from "@builder.io/qwik";
import {
	Form,
	Link,
	routeAction$,
	routeLoader$,
	z,
	zod$
} from "@builder.io/qwik-city";
import { auth } from "~/lib/lucia";
import { Prisma } from "@prisma/client";
import { LuciaError } from "lucia-auth";

// .... the action hook shown above

export default component$(() => {
	const loginAction = useLoginAction();

	return (
		<>
			<h2>Sign in</h2>

			<Form action={loginAction}>
				<label for="username">username</label>
				<br />
				<input id="username" name="username" />
				<br />
				<label for="password">password</label>
				<br />
				<input type="password" id="password" name="password" />
				<br />
				<button type="submit">Continue</button>
			</Form>
			<Link href="/signup">Create a new account</Link>
		</>
	);
});
```

### Redirect authenticated users

If the session exists, redirect authenticated users to the profile page.

```tsx
// src/routes/login/index.tsx
import { component$ } from "@builder.io/qwik";
import {
	Link,
	routeLoader$,
	Form,
	zod$,
	z,
	routeAction$
} from "@builder.io/qwik-city";
import { auth } from "~/lib/lucia";
import type { LuciaError } from "lucia-auth";

export const useUserLoader = routeLoader$(async (event) => {
	const authRequest = auth.handleRequest(event);
	const { session } = await authRequest.validateUser();
	if (session) throw event.redirect(302, "/");

	return {};
});

// ... the action hook shown above

// ... the functional component shown above
```

## 5. Profile page (protected)

This page will be the root page (`/`). This route will show the user's data and have the note-taking portion of the app.

### Get current user

We'll use [`routeLoader$`](https://qwik.builder.io/docs/loader/) to get the current user. This will be called when the page is loaded and if the user is not authenticated, we'll redirect them to the login page.

```tsx
// src/routes/index.tsx
import { component$ } from "@builder.io/qwik";
import { routeLoader$, Form, routeAction$ } from "@builder.io/qwik-city";
import { auth } from "~/lib/lucia";

export const useUserLoader = routeLoader$(async (event) => {
	const authRequest = auth.handleRequest(event);
	const { user } = await authRequest.validateUser();

	if (!user) throw event.redirect(302, "/login");

	return {
		user
	};
});

export default component$(() => {
	const userLoader = useUserLoader();
	return (
		<>
			<h1>Profile</h1>
			<div>
				<p>User id: {userLoader.value.user.userId}</p>
				<p>Username: {userLoader.value.user.username}</p>
			</div>
		</>
	);
});
```

### Sign out

Create a new action to sign out the user. This will invalidate the session and redirect the user to the login page.

```ts
// src/routes/index.tsx
import { component$ } from "@builder.io/qwik";
import { routeLoader$, routeAction$ } from "@builder.io/qwik-city";
import { auth } from "~/lib/lucia";

export const useSignoutAction = routeAction$(async (values, event) => {
	const authRequest = auth.handleRequest(event);
	const { session } = await authRequest.validateUser();

	if (!session) throw event.redirect(302, "/login");

	await auth.invalidateSession(session.sessionId);
	authRequest.setSession(null);
	throw event.redirect(302, "/login");
});
```

This can be called when submitting a form:

```tsx
// src/routes/index.tsx
import {
	routeLoader$,
	routeAction$,
	Form // Let's import the Form component
} from "@builder.io/qwik-city";

// ...

export default component$(() => {
	const userLoader = useUserLoader();
	const signoutAction = useSignoutAction();

	return (
		<>
			<h1>Profile</h1>
			<div>
				<p>User id: {userLoader.value.user.userId}</p>
				<p>Username: {userLoader.value.user.username}</p>
			</div>

			<Form action={signoutAction}>
				<button type="submit">Sign out</button>
			</Form>
		</>
	);
});
```

## 6. Validate requests

`AuthRequest` can be used inside loaders and actions:

```ts
import { auth } from "~/lib/lucia";
import { routeLoader$, routeAction$ } from "@builder.io/qwik-city";

export const useUserLoader = routeLoader$(async (event) => {
	const authRequest = auth.handleRequest(event);
	const { session, user } = await authRequest.validateUser();
	// ...
});

export const useUserAction = routeAction$(async (_values, event) => {
	const authRequest = auth.handleRequest(event);
	const { session, user } = await authRequest.validateUser();
	// ...
});
```
