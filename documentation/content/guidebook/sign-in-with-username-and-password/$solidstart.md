---
title: "Sign in with username and password in SolidStart"
description: "Learn the basic of Lucia by implementing a basic username and password authentication"
---

_Before starting, make sure you've [setup Lucia and your database](/getting-started/solidstart)._

This guide will cover how to implement a simple username and password authentication using Lucia in SolidStart. It will have 3 parts:

- A sign up page
- A sign in page
- A profile page with a logout button

### Clone project

You can get started immediately by cloning the [SolidStart example](https://github.com/pilcrowOnPaper/lucia/tree/main/examples/solidstart/username-and-password) from the repository.

```
npx degit pilcrowonpaper/lucia/examples/solidstart/username-and-password <directory_name>
```

Alternatively, you can [open it in StackBlitz](https://stackblitz.com/github/pilcrowOnPaper/lucia/tree/main/examples/solidstart/username-and-password).

## Update your database

Add a `username` column to your table. It should be a `string` (`TEXT`, `VARCHAR` etc) type that's unique.

Make sure you update `Lucia.DatabaseUserAttributes` whenever you add any new columns to the user table.

```ts
// src/app.d.ts
/// <reference types="lucia" />
declare namespace Lucia {
	type Auth = import("./auth/lucia").Auth;
	type DatabaseUserAttributes = {
		username: string;
	};
	type DatabaseSessionAttributes = {};
}
```

## Configure Lucia

We'll expose the user's username to the `User` object by defining [`getUserAttributes`](/basics/configuration#getuserattributes).

```ts
// src/auth/lucia.ts
import { lucia } from "lucia";
import { web } from "lucia/middleware";

export const auth = lucia({
	adapter: ADAPTER,
	env: process.env.NODE_ENV === "development" ? "DEV" : "PROD",
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

Create `src/routes/signup.tsx`. Use `createServerAction$()` to create a form with inputs for username and password.

```tsx
// src/routes/signup.tsx
import { A } from "solid-start";
import { createServerAction$ } from "solid-start/server";

const Page = () => {
	const [_, { Form }] = createServerAction$(async (formData: FormData) => {});
	return (
		<>
			<h1>Sign up</h1>
			<Form>
				<label for="username">Username</label>
				<input name="username" id="username" />
				<br />
				<label for="password">Password</label>
				<input type="password" name="password" id="password" />
				<br />
				<input type="submit" />
			</Form>
			<A href="/login">Sign in</A>
		</>
	);
};

export default Page;
```

### Create users

The form submission will be handled within a server action.

Users can be created with [`Auth.createUser()`](/reference/lucia/interfaces/auth#createuser). This will create a new user, and if `key` is defined, a new key. The key here defines the connection between the user and the provided unique username (`providerUserId`) when using the username & password authentication method (`providerId`). We'll also store the password in the key. This key will be used get the user and validate the password when logging them in. The type for `attributes` property is `Lucia.DatabaseUserAttributes`, which we added `username` to previously.

After successfully creating a user, we'll create a new session with [`Auth.createSession()`](/reference/lucia/interfaces/auth#createsession). This session should be stored as a cookie, which can be created with [`Auth.createSessionCookie()`](/reference/lucia/interfaces/auth#createsessioncookie). You can store this cooking by passing `Cooke.serialize()` to the `Set-Cookie` response header.

```ts
// src/routes/signup.tsx
import { A } from "solid-start";
import { auth } from "~/auth/lucia";
import { createServerAction$, ServerError } from "solid-start/server";

const Page = () => {
	const [_, { Form }] = createServerAction$(async (formData: FormData) => {
		const username = formData.get("username");
		const password = formData.get("password");
		if (
			typeof username !== "string" ||
			username.length < 4 ||
			username.length > 31
		) {
			throw new ServerError("Invalid username");
		}
		if (
			typeof password !== "string" ||
			password.length < 6 ||
			password.length > 255
		) {
			throw new ServerError("Invalid password");
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
			// set cookie and redirect
			return new Response(null, {
				status: 302,
				headers: {
					Location: "/",
					"Set-Cookie": sessionCookie.serialize()
				}
			});
		} catch (e) {
			// this part depends on the database you're using
			// check for unique constraint error in user table
			if (
				e instanceof SomeDatabaseError &&
				e.message === USER_TABLE_UNIQUE_CONSTRAINT_ERROR
			) {
				throw new ServerError("Username already taken");
			}
			throw new ServerError("An unknown error occurred", {
				status: 500
			});
		}
	});
	// ...
};

export default Page;
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

Lucia throws 2 types of errors: [`LuciaError`](/reference/lucia/modules/main#luciaerror) and database errors from the database driver or ORM you're using. Most database related errors, such as connection failure, duplicate values, and foreign key constraint errors, are thrown as is. These need to be handled as if you were using just the driver/ORM.

```ts
if (
	e instanceof SomeDatabaseError &&
	e.message === USER_TABLE_UNIQUE_CONSTRAINT_ERROR
) {
	// username already taken
}
```

### Redirect authenticated users

Authenticated users should be redirected to the profile page whenever they try to access the sign up page. You can validate requests by creating by calling [`AuthRequest.validate()`](/reference/lucia/interfaces/authrequest#validate). This method returns a [`Session`](/reference/lucia/interfaces#session) if the user is authenticated or `null` if not. A new [`AuthRequest`](/reference/lucia/interfaces/authrequest) instance can be created by calling [`Auth.handleRequest()`](/reference/lucia/interfaces/auth#handlerequest) with `Request`.

Make sure to do the check inside `createServerData$()`.

```tsx
// src/routes/signup.tsx
import { A } from "solid-start";
import { auth } from "~/auth/lucia";
import {
	createServerAction$,
	createServerData$,
	redirect,
	ServerError
} from "solid-start/server";

export const routeData = () => {
	return createServerData$(async (_, event) => {
		const authRequest = auth.handleRequest(event.request);
		const session = await authRequest.validate();
		if (session) {
			return redirect("/");
		}
	});
};

const Page = () => {
	// ...
};

export default Page;
```

## Sign in page

Create `src/routes/login.tsx` and also add a form with inputs for username and password with `createServerAction$()`.

```tsx
// src/routes/login.ts
import { A } from "solid-start";
import { createServerAction$ } from "solid-start/server";

const Page = () => {
	const [_, { Form }] = createServerAction$(async (formData: FormData) => {});
	return (
		<>
			<h1>Sign in</h1>
			<Form>
				<label for="username">Username</label>
				<input name="username" id="username" />
				<br />
				<label for="password">Password</label>
				<input type="password" name="password" id="password" />
				<br />
				<input type="submit" />
			</Form>
			<A href="/signup">Create an account</A>
		</>
	);
};

export default Page;
```

### Authenticate users

The form submission will be handled within a server action.

The key we created for the user allows us to get the user via their username, and validate their password. This can be done with [`Auth.useKey()`](/reference/lucia/interfaces/auth#usekey). If the username and password is correct, we'll create a new session just like we did before. If not, Lucia will throw an error. Make sure to make the username lowercase before calling `useKey()`.

```tsx
// src/routes/login.tsx
import { A } from "solid-start";
import { auth } from "~/auth/lucia";
import { ServerError, createServerAction$ } from "solid-start/server";
import { LuciaError } from "lucia";

const Page = () => {
	const [enrolling, { Form }] = createServerAction$(
		async (formData: FormData) => {
			const username = formData.get("username");
			const password = formData.get("password");
			// basic check
			if (
				typeof username !== "string" ||
				username.length < 1 ||
				username.length > 31
			) {
				throw new ServerError("Invalid username");
			}
			if (
				typeof password !== "string" ||
				password.length < 1 ||
				password.length > 255
			) {
				throw new ServerError("Invalid password");
			}
			try {
				// find user by key
				// and validate password
				const key = await auth.useKey(
					"username",
					username.toLowerCase(),
					password
				);
				const session = await auth.createSession({
					userId: key.userId,
					attributes: {}
				});
				const sessionCookie = auth.createSessionCookie(session);
				// set cookie and redirect
				return new Response(null, {
					status: 302,
					headers: {
						Location: "/",
						"Set-Cookie": sessionCookie.serialize()
					}
				});
			} catch (e) {
				if (
					e instanceof LuciaError &&
					(e.message === "AUTH_INVALID_KEY_ID" ||
						e.message === "AUTH_INVALID_PASSWORD")
				) {
					// user does not exist
					// or invalid password
					throw new ServerError("Incorrect username or password");
				}
				throw new ServerError("An unknown error occurred");
			}
		}
	);
	// ...
};

export default Page;
```

### Redirect authenticated users

As we did in the sign up page, redirect authenticated users to the profile page.

```ts
// src/routes/login.tsx
import { A } from "solid-start";
import { auth } from "~/auth/lucia";
import {
	createServerAction$,
	createServerData$,
	redirect,
	ServerError
} from "solid-start/server";
import { LuciaError } from "lucia";

export const routeData = () => {
	return createServerData$(async (_, event) => {
		const authRequest = auth.handleRequest(event.request);
		const session = await authRequest.validate();
		if (session) {
			return redirect("/");
		}
	});
};

const Page = () => {
	// ...
};

export default Page;
```

## Profile page

Create `src/routes/index.tsx`. This page will show some basic user info and include a logout button.

Unauthenticated users should be redirected to the login page. The user object is available in `Session.user`, and you’ll see that `User.username` exists because we defined it in first step with `getUserAttributes()` configuration.

```tsx
// src/routes/index.tsx
import { useRouteData } from "solid-start";
import { createServerData$, redirect } from "solid-start/server";
import { auth } from "~/auth/lucia";

export const routeData = () => {
	return createServerData$(async (_, event) => {
		const authRequest = auth.handleRequest(event.request);
		const session = await authRequest.validate();
		if (!session) {
			return redirect("/login") as never;
		}
		return session.user;
	});
};

const Page = () => {
	const user = useRouteData<typeof routeData>();
	return (
		<>
			<h1>Profile</h1>
			<p>User id: {user()?.userId}</p>
			<p>Username: {user()?.username}</p>
		</>
	);
};

export default Page;
```

### Sign out users

The form submission will be handled within a server action.

When logging out users, it's critical that you invalidate the user's session. This can be achieved with [`Auth.invalidateSession()`](/reference/lucia/interfaces/auth#invalidatesession). You can delete the session cookie by overriding the existing one with a blank cookie that expires immediately. This can be created by passing `null` to `Auth.createSessionCookie()`.

```tsx
// src/routes/index.tsx
import { useRouteData } from "solid-start";
import {
	ServerError,
	createServerAction$,
	createServerData$,
	redirect
} from "solid-start/server";
import { auth } from "~/auth/lucia";

export const routeData = () => {
	// ...
};

const Page = () => {
	const user = useRouteData<typeof routeData>();
	const [_, { Form }] = createServerAction$(async (_, event) => {
		const authRequest = auth.handleRequest(event.request);
		const session = await authRequest.validate();
		if (!session) {
			throw new ServerError("Unauthorized", {
				status: 401
			});
		}
		await auth.invalidateSession(session.sessionId); // invalidate session
		const sessionCookie = auth.createSessionCookie(null);
		return new Response(null, {
			status: 302,
			headers: {
				Location: "/login",
				"Set-Cookie": sessionCookie.serialize()
			}
		});
	});
	return (
		<>
			<h1>Profile</h1>
			<p>User id: {user()?.userId}</p>
			<p>Username: {user()?.username}</p>
			<Form>
				<button>Sign out</button>
			</Form>
		</>
	);
};

export default Page;
```
