---
title: "Username/password example with the App router"
_order: 2
---

This page will guide you how to implement a simple username/password auth with the App router and cover the basics of Lucia. Keep in mind that due to a limitation with cookies when using the App router, Lucia cannot automatically renew sessions.

Make sure you've setup Lucia and your database as covered in [Getting started](/start-here/getting-started?nextjs).

### Clone example project

You can also clone the [Next.js App router example](https://github.com/pilcrowOnPaper/lucia/tree/main/examples/nextjs-app), which uses SQLite + Prisma. Clone it locally with a single command:

```
npx degit pilcrowonpaper/lucia/examples/nextjs-app <project_name>
```

Alternatively, you can [open it in StackBlitz](https://stackblitz.com/github/pilcrowOnPaper/lucia/tree/main/examples/nextjs-app).

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

Add [`transformDatabaseUser()`](/basics/configuration#transformuserdata) to your Lucia config to expose the user's id and username (by default only `userId` is added). The returned value will be the `User` object. We also recommend extending the session expiration to a month since Lucia cannot renew sessions when using the App router.

```ts
// auth/lucia.ts
export const auth = lucia({
	adapter: prisma(),
	env: "DEV" // "PROD" if prod,
	middleware: nextjs(),
	transformDatabaseUser: (userData) => {
		return {
			userId: userData.id,
			username: userData.username
		};
	},
	sessionExpiresIn: {
		activePeriod: 1000 * 60 * 60 * 24 * 30, // 1 month
		idlePeriod: 0 // disable session renewal
	}
});
```

## 3. Create a basic `Form` component

Create a form component, that when submitted, will send a POST request to the endpoint defined in the `action` prop. It will also display an error message when the `fetch()` request returns an error.

```tsx
// components/form.tsx
"use client";

import { useRouter } from "next/navigation";
import React, { useState } from "react";

const Form = ({
	children,
	action
}: {
	children: React.ReactNode;
	action: string;
}) => {
	const router = useRouter();
	const [errorMessage, setErrorMessage] = useState("");
	return (
		<>
			<form
				onSubmit={async (e) => {
					e.preventDefault();
					setErrorMessage("");
					const formData = new FormData(e.currentTarget);
					const username = formData.get("username");
					const password = formData.get("password");

					const response = await fetch(e.currentTarget.action, {
						method: "POST",
						body: JSON.stringify({
							username,
							password
						})
					});
					if (response.redirected) return router.push(response.url);
					const result = (await response.json()) as {
						error: string;
					};
					setErrorMessage(result.error);
				}}
				action={action}
			>
				{children}
			</form>
			<p>{errorMessage}</p>
		</>
	);
};

export default Form;
```

## 4. Sign up page

### Sign up form

Create `app/signup/page.tsx`. This page will have a form with an input field for username and password, which will be handled by `/api/signup`.

```tsx
// app/signup/page.tsx
import Form from "@/components/form";

const Page = async () => {
	return (
		<>
			<h2>Create an account</h2>
			<Form action="/api/signup">
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

export default Page;
```

### Create users

Create `app/api/signup/route.ts`. This API route will handle account creation.

Calling [`handleRequest()`] will create a new [`AuthRequest`](/reference/lucia-auth/authrequest) instance, which makes it easier to handle sessions and cookies.

Users can be created with `createUser()`. This will create a new primary key that can be used to authenticate user as well. We’ll use `"username"` as the provider id (authentication method) and the username as the provider user id (something unique to the user). Create a new session with [`createSession()`](/reference/lucia-auth/auth?nextjs#createsession) and make sure to store the session id by calling [`setSession()`](/reference/lucia-auth/authrequest#setsession).

```ts
// app/api/signup/route.ts
import { auth } from "@/auth/lucia";
import { LuciaError } from "lucia-auth";
import { Prisma } from "@prisma/client";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export const POST = async (request: Request) => {
	const { username, password } = await request.json();
	if (typeof username !== "string" || typeof password !== "string") {
		return NextResponse.json(
			{
				error: "Invalid input"
			},
			{
				status: 400
			}
		);
	}
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
		const authRequest = auth.handleRequest({ request, cookies });
		authRequest.setSession(session);
		// using redirect() ignores cookie
		new Response(null, {
			status: 302,
			headers: {
				location: "/"
			}
		});
	} catch (error) {
		// username taken
		return NextResponse.json(null, {
			status: 400
		});
	}
};
```

#### Handle requests

Calling [`handleRequest()`] will create a new [`AuthRequest`](/reference/lucia-auth/authrequest) instance, which makes it easier to handle sessions and cookies. This can be initialized with `Request` and `cookies()`.

In this case, we don't need to validate the request, but we do need it for setting the session cookie with [`AuthRequest.setSession()`](/reference/lucia-auth/authrequest#setsession).

```ts
const authRequest = auth.handleRequest({ request, cookies });
```

> (warn) Next.js does not check for [cross site request forgery (CSRF)](https://owasp.org/www-community/attacks/csrf) on API requests. While `AuthRequest.validateUser()` will do a CSRF check and only return a user/session if it passes the check, **make sure to add CSRF protection** to routes that doesn't rely on Lucia for validation. You can check if the request is coming from the same domain as where the app is hosted by using the `Origin` header.

#### Set user passwords

We don't store the password in the user, but in a key (`primaryKey`). Keys represent the relationship between a user and a auth method, in this case username/password. We'll set `"username"` as the provider id (authentication method) and the username as the provider user id (something unique to the user).

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

[`AuthRequest.validateUser()`](/reference/lucia-auth/authrequest#validateuser) can be used inside a server component to validate the request and get the current session.

```ts
// app/signup/page.tsx
import { auth } from "@/auth/lucia";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import Form from "@/components/form";

const Page = async () => {
	const authRequest = auth.handleRequest({ cookies });
	const { session } = await authRequest.validateUser();
	if (session) redirect("/");
	// ...
};

export default Page;
```

## 5. Sign in page

### Sign in form

Create `app/login/page.tsx`. This page will have a form with an input field for username and password, which will be handled by `/api/login`.

```tsx
// pages/login.tsx
import Form from "@/components/form";

const Page = async () => {
	return (
		<>
			<h2>Sign in</h2>
			<Form action="/api/login">
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

export default Page;
```

### Authenticate users

Create `app/api/login/route.ts`. This API route will handle sign-ins.

We’ll use the key created in the previous section to reference the user and authenticate them by validating the password with [`useKey()`](/reference/lucia-auth/auth#usekey) . Create a new session if the password is valid.

```ts
// app/api/login/route.ts
import { auth } from "@/auth/lucia";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { LuciaError } from "lucia-auth";

export const POST = async (request: Request) => {
	const { username, password } = await request.json();
	if (typeof username !== "string" || typeof password !== "string") {
		return NextResponse.json(
			{
				error: "Invalid input"
			},
			{
				status: 400
			}
		);
	}
	try {
		const authRequest = auth.handleRequest({ request, cookies });
		const key = await auth.useKey("username", username, password);
		const session = await auth.createSession(key.userId);
		authRequest.setSession(session);
		return new Response(null, {
			status: 302,
			headers: {
				location: "/"
			}
		});
	} catch (error) {
		// invalid username/password
		console.error(error);
		return NextResponse.json(null, {
			status: 400
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
// app/login/page.tsx
import { auth } from "@/auth/lucia";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import Form from "@/components/form";

const Page = async () => {
	const authRequest = auth.handleRequest({ cookies });
	const { session } = await authRequest.validateUser();
	if (session) redirect("/");
	return (
		<>
			<h2>Sign in</h2>
			<Form action="/api/login">
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

export default Page;
```

## 6. Profile page (protected)

This page will be the root page (`/`). This route will show the user's data.

### Get current user

Create `app/page.tsx`. Redirect the user to `/login` if they are unauthenticated. It will also have a form that handles for logging out.

```tsx
// app/page.tsx
import { auth } from "@/auth/lucia";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import Form from "@/components/form";

const Page = async () => {
	const authRequest = auth.handleRequest({ cookies });
	const { user } = await authRequest.validateUser();
	if (!user) redirect("/login");
	return (
		<>
			<h1>Profile</h1>
			<div>
				<p>User id: {props.user?.userId}</p>
				<p>Username: {props.user?.username}</p>
			</div>

			<Form action="/api/logout">
				<input type="submit" value="Sign out" />
			</Form>
		</>
	);
};

export default Page;
```

### Sign out

Create `app/api/logout/route.ts`. This API route will handle sign-outs, and it will invalidate the current session and remove the session cookie.

```ts
// app/api/logout/route.ts
import { auth } from "@/auth/lucia";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export const POST = async (request: Request) => {
	const authRequest = auth.handleRequest({ request, cookies });
	const { session } = await authRequest.validateUser();
	if (!session) {
		return NextResponse.json(null, {
			status: 401
		});
	}
	await auth.invalidateSession(session.sessionId);
	authRequest.setSession(null); // delete session cookie
	return new Response(null, {
		status: 302,
		headers: {
			location: "/login"
		}
	});
};
```
