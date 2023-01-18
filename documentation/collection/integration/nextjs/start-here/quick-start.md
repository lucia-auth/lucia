---
_order: 1
title: "Quick start"
---

This page will guide you how to implement a simple username/password auth and cover the basics of Lucia.

The [Next.js example project](https://github.com/pilcrowOnPaper/lucia-auth/tree/main/examples/nextjs) in the repo expands on this guide.

Start off by following the steps in [the previous page](/nextjs/start-here/getting-started) to set up Lucia and your database.

## 1. Configure your database

As an example, we'll add a `username` column to the `user` table. The `username` column will be later used as an identifier for creating new users, but
you could replace it with `email`, for example.

| name     | type   | unique | description          |
| -------- | ------ | ------ | -------------------- |
| username | string | true   | Username of the user |

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

Add [`transformUserData()`](/reference/configure/lucia-configurations#transformuserdata) to your Lucia config to expose the user's id and username (by default only `userId` is added). The returned value will be the `User` object.

```ts
// lib/lucia.ts

// ...

export const auth = lucia({
	adapter: prisma(),
	env: dev ? "DEV" : "PROD",
	transformUserData: (userData) => {
		return {
			userId: userData.id,
			username: userData.username
		};
	}
});
```

## 3. Sign up page

### Sign up form

Create `pages/signup.tsx`. This form will have an input field for username and password.

```tsx
// pages/signup.tsx
import Link from "next/link";
import { useRouter } from "next/router";
import React from "react";

const Index = () => {
	const router = useRouter();
	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		const formValues = e.target as any as Record<
			"username" | "password",
			{
				value: string;
			}
		>;
		const username = formValues.username.value;
		const password = formValues.password.value;
		const response = await fetch("/api/signup", {
			method: "POST",
			body: JSON.stringify({
				username,
				password
			})
		});
		if (response.redirected) return router.push(response.url); // redirect on redirect responses
	};
	return (
		<div>
			<h1>Create an account</h1>
			<form method="post" onSubmit={handleSubmit} action="/api/signup">
				<label htmlFor="username">username</label>
				<br />
				<input id="username" name="username" />
				<br />
				<label htmlFor="password">password</label>
				<br />
				<input type="password" id="password" name="password" />
				<br />
				<input type="submit" value="Continue" className="button" />
			</form>
			<Link href="/login" className="link">
				Sign in
			</Link>
		</div>
	);
};

export default Index;
```

### Create users

Create `pages/api/signup.ts`. This API route will handle account creation.

We'll set the provider id as `username` and the inputted username as the identifier. This tells Lucia that the user was created using the username/password auth method and that the unique identifier is the username. The `createUser` method also handles password hashing before storing the user. After creating a new user, create a new session and store the session id as a cookie.

```ts
// pages/api/signup.ts
import type { NextApiRequest, NextApiResponse } from "next";
import { auth } from "../../lib/lucia";
import { AuthRequest } from "@lucia-auth/nextjs";

export default async (req: NextApiRequest, res: NextApiResponse) => {
	if (req.method !== "POST")
		return res.status(404).json({ error: "Not found" });
	const { username, password } = JSON.parse(req.body);
	if (
		!username ||
		!password ||
		typeof username !== "string" ||
		typeof password !== "string"
	)
		return res.status(400).json({});
	try {
		const user = await auth.createUser("username", username, {
			password,
			attributes: {
				username
			}
		});
		const session = await auth.createSession(user.userId);
		const authRequest = new AuthRequest(auth, req, res);
		authRequest.setSession(session); // set cookies
		return res.redirect(302, "/"); // redirect user on account creations
	} catch (e) {
		return res.status(400).json({}); // invalid
	}
};
```

### Redirect authenticated users

[`authRequest.validate()`](/nextjs/api-reference/server-api#validate) can be used inside a server context to validate the request and get the current session.

```diff
import Link from "next/link";
import { useRouter } from "next/router";
import React from "react";
+ import { auth } from "../lib/lucia";
+ import { AuthRequest } from "@lucia-auth/nextjs";

+ import type { GetServerSidePropsContext, GetServerSidePropsResult } from "next";
```

```ts
// pages/signup.tsx

export const getServerSideProps = async (
	context: GetServerSidePropsContext
): Promise<GetServerSidePropsResult<{}>> => {
	const authRequest = new AuthRequest(auth, context.req, context.res);
	const session = await authRequest.validate();
	if (session) {
		// redirect the user if authenticated
		return {
			redirect: {
				destination: "/",
				permanent: false
			}
		};
	}
	return {
		props: {}
	};
};

// ...
```

## 4. Sign in page

### Sign in form

Create `pages/login.tsx`. This route will handle sign ins. This form will also have an input field for username and password.

```tsx
// pages/login.tsx
import Link from "next/link";
import { useRouter } from "next/router";
import React from "react";

const Index = () => {
	const router = useRouter();
	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		const formValues = e.target as any as Record<
			"username" | "password",
			{
				value: string;
			}
		>;
		const username = formValues.username.value;
		const password = formValues.password.value;
		const response = await fetch("/api/login", {
			method: "POST",
			body: JSON.stringify({
				username,
				password
			})
		});
		if (response.redirected) return router.push(response.url);
	};
	return (
		<div>
			<h1>Sign in</h1>
			<form method="post" onSubmit={handleSubmit} action="/api/login">
				<label htmlFor="username">username</label>
				<br />
				<input id="username" name="username" />
				<br />
				<label htmlFor="password">password</label>
				<br />
				<input type="password" id="password" name="password" />
				<br />
				<input type="submit" value="Continue" className="button" />
			</form>
			<Link href="/signup" className="link">
				Create a new account
			</Link>
		</div>
	);
};

export default Index;
```

### Authenticate users

Create pages/api/login.ts. This API route will handle sign-ins.

We'll use `username` as the provider id and the username as the identifier. This tells Lucia to find a user that was created using username/password auth method where the unique identifier is the username. Create a new session if the password is valid, and store the session id.

```ts
// pages/api/login.ts
import { AuthRequest } from "@lucia-auth/nextjs";
import type { NextApiRequest, NextApiResponse } from "next";
import { auth } from "../../lib/lucia";

export default async (req: NextApiRequest, res: NextApiResponse) => {
	if (req.method !== "POST")
		return res.status(404).json({ error: "Not found" });
	const { username, password } = JSON.parse(req.body);
	if (
		!username ||
		!password ||
		typeof username !== "string" ||
		typeof password !== "string"
	)
		return res.status(400).json({});
	try {
		const authRequest = new AuthRequest(auth, req, res);
		const user = await auth.authenticateUser("username", username, password);
		const session = await auth.createSession(user.userId);
		authRequest.setSession(session); // set cookie
		return res.redirect(302, "/"); // redirect to profile page
	} catch {
		// invalid
		return res.status(200).json({
			error: "Incorrect username or password"
		});
	}
};
```

### Redirect authenticated users

If the session exists, redirect authenticated users to the profile page.

```diff
import Link from "next/link";
import { useRouter } from "next/router";
import React from "react";
+ import { auth } from "../lib/lucia";
+ import { AuthRequest } from "@lucia-auth/nextjs";

+ import type { GetServerSidePropsContext, GetServerSidePropsResult } from "next";
```

```ts
// pages/login.tsx
export const getServerSideProps = async (
	context: GetServerSidePropsContext
): Promise<GetServerSidePropsResult<{}>> => {
	const authRequest = new AuthRequest(auth, context.req, context.res);
	const session = await authRequest.validate();
	if (session) {
		// redirect the user if authenticated
		return {
			redirect: {
				destination: "/",
				permanent: false
			}
		};
	}
	return {
		props: {}
	};
};

// ...
```

## 5. Profile page (protected)

This page will be the root page (`/`). This route will show the user's data and have the note-taking portion of the app.

### Get current user

Create `pages/index.tsx` and set up the page and `getServerSideProps()`. Redirect the user to `/login` if they are unauthenticated.

```tsx
import React from "react";
import { AuthRequest } from "@lucia-auth/nextjs";
import { auth } from "../lib/lucia";

import type {
	GetServerSidePropsContext,
	GetServerSidePropsResult,
	InferGetServerSidePropsType
} from "next";
import type { User } from "lucia-auth";

export const getServerSideProps = async (
	context: GetServerSidePropsContext
): Promise<GetServerSidePropsResult<{ user: User }>> => {
	const authRequest = new AuthRequest(auth, context.req, context.res);
	const { user } = await authRequest.validateUser();
	if (!user)
		return {
			redirect: {
				destination: "/login",
				permanent: false
			}
		};
	return {
		props: {
			user
		}
	};
};

const Index = (
	props: InferGetServerSidePropsType<typeof getServerSideProps>
) => {
	return (
		<>
			<h1>Profile</h1>
			<p>
				This page is protected and can only be accessed by authenticated users.
			</p>
			<div>
				<p>User id: {props.user?.userId}</p>
				<p>Username: {props.user?.username}</p>
			</div>
		</>
	);
};

export default Index;
```

### Sign out

Add a button that calls [`signOut()`](/nextjs/api-reference/client-api#signout) (imported from `@lucia-auth/nextjs/client`) and redirect the user to `/login` afterward.

```diff
import { AuthRequest } from "@lucia-auth/nextjs";
import { auth } from "../lib/lucia";
import React from "react";
+ import { signOut } from "@lucia-auth/nextjs/client";
+ import { useRouter } from "next/router";

import type {
	GetServerSidePropsContext,
	GetServerSidePropsResult,
	InferGetServerSidePropsType
} from "next";
import type { User } from "lucia-auth";
```

```tsx
// pages/index.tsx

// ...

const Index = (
	props: InferGetServerSidePropsType<typeof getServerSideProps>
) => {
	const router = useRouter();
	return (
		<>
			<h1>Profile</h1>
			<p>
				This page is protected and can only be accessed by authenticated users.
			</p>
			<div>
				<p>User id: {props.user?.userId}</p>
				<p>Username: {props.user?.username}</p>
			</div>

			<button
				onClick={async () => {
					await signOut();
					router.push("/login");
				}}
			>
				Sign out
			</button>
		</>
	);
};

export default Index;
```

## 6. Request validation

`AuthRequest` can also be used inside API routes:

```ts
import { AuthRequest } from "@lucia-auth/nextjs";
import { auth } from "../../lib/lucia";
import type { NextApiRequest, NextApiResponse } from "next";

export default async (req: NextApiRequest, res: NextApiResponse) => {
	const authRequest = new AuthRequest(auth, req, res);
	const session = await authRequest.validate();
	// ...
};
```
