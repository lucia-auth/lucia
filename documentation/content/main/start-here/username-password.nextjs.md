---
_order: 2
title: "Username/password example"
description: "Learn how to use Lucia in Next.js by implementing a basic username/password auth"
---

This page will guide you how to implement a simple username/password auth and cover the basics of Lucia. This uses the Next.js `pages` router as it's the only configuration fully compatible with Lucia. To use the new App router, refer to [Username/password example with the App router](/nextjs/username-password-example-app-router).

Start off by following the steps in the [previous page](/start-here/getting-started?nextjs) to set up Lucia and your database.

### Clone example project

You can also clone the [Next.js example](https://github.com/pilcrowOnPaper/lucia/tree/main/examples/nextjs), which uses SQLite + Prisma. Clone it locally with a single command:

```
npx degit pilcrowonpaper/lucia/examples/nextjs <project_name>
```

Alternatively, you can [open it in StackBlitz](https://stackblitz.com/github/pilcrowOnPaper/lucia/tree/main/examples/nextjs).

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
// lib/lucia.ts
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

Create `pages/signup.tsx`. This form will have an input field for username and password.

```tsx
// pages/signup.tsx
import Link from "next/link";
import { useRouter } from "next/router";
import React from "react";

export default () => {
	const router = useRouter();
	const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
		e.preventDefault();
		const formData = new FormData(e.currentTarget);
		const username = formData.get("username");
		const password = formData.get("password");

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
				<input type="submit" value="Continue" />
			</form>
			<Link href="/login">Sign in</Link>
		</div>
	);
};
```

### Create users

Create `pages/api/signup.ts`. This API route will handle account creation.

Calling [`handleRequest()`] will create a new [`AuthRequest`](/reference/lucia-auth/authrequest) instance, which makes it easier to handle sessions and cookies. This can be initialized with `NextApiRequest` and `NextApiResponse`.

Users can be created with `createUser()`. This will create a new primary key that can be used to authenticate user as well. We’ll use `"username"` as the provider id (authentication method) and the username as the provider user id (something unique to the user). Create a new session with [`createSession()`](/reference/lucia-auth/auth?nextjs#createsession) and make sure to store the session id by calling [`setSession()`](/reference/lucia-auth/authrequest#setsession).

```ts
// pages/api/signup.ts
import type { NextApiRequest, NextApiResponse } from "next";
import { auth } from "../../lib/lucia";

export default async (req: NextApiRequest, res: NextApiResponse) => {
	if (req.method !== "POST")
		return res.status(404).json({ error: "Not found" });
	const { username, password } = JSON.parse(req.body);
	if (typeof username !== "string" || typeof password !== "string")
		return res.status(400).json({});
	const authRequest = auth.handleRequest({ req, res });
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
		authRequest.setSession(session); // set cookies
		return res.redirect(302, "/"); // redirect user on account creations
	} catch (e) {
		// username taken
		return res.status(400).json({});
	}
};
```

#### Handle requests

Calling [`handleRequest()`] will create a new [`AuthRequest`](/reference/lucia-auth/authrequest) instance, which makes it easier to handle sessions and cookies. This can be initialized with `NextApiRequest` and `NextApiResponse`.

In this case, we don't need to validate the request, but we do need it for setting the session cookie with [`AuthRequest.setSession()`](/reference/lucia-auth/authrequest#setsession).

```ts
const authRequest = auth.handleRequest({ req, res });
```

> (warn) Next.js does not check for [cross site request forgery (CSRF)](https://owasp.org/www-community/attacks/csrf) on API requests. While `AuthRequest.validateUser()` will do a CSRF check and only return a user/session if it passes the check, **make sure to add CSRF protection** to routes that doesn't rely on Lucia for validation. You can check if the request is coming from the same domain as where the app is hosted by using the `Origin` header.

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
// pages/signup.tsx
import Link from "next/link";
import { useRouter } from "next/router";
import React from "react";
import { auth } from "../lib/lucia";
import type { GetServerSidePropsContext, GetServerSidePropsResult } from "next";

export const getServerSideProps = async (
	context: GetServerSidePropsContext
): Promise<GetServerSidePropsResult<{}>> => {
	const authRequest = auth.handleRequest(context);
	const { session } = await authRequest.validateUser();
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

export default () => {
	const router = useRouter();
	const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
		e.preventDefault();
		const formData = new FormData(e.currentTarget);
		const username = formData.get("username");
		const password = formData.get("password");

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
				<input type="submit" value="Continue" />
			</form>
			<Link href="/signup">Create a new account</Link>
		</div>
	);
};
```

### Authenticate users

Create `pages/api/login.ts`. This API route will handle sign-ins.

We’ll use the key created in the previous section to reference the user and authenticate them by validating the password with [`useKey()`](/reference/lucia-auth/auth#usekey) . Create a new session if the password is valid.

```ts
// pages/api/login.ts

import type { NextApiRequest, NextApiResponse } from "next";
import { auth } from "../../lib/lucia";

export default async (req: NextApiRequest, res: NextApiResponse) => {
	if (req.method !== "POST")
		return res.status(404).json({ error: "Not found" });
	const { username, password } = JSON.parse(req.body);
	if (typeof username !== "string" || typeof password !== "string")
		return res.status(400).json({});
	try {
		const authRequest = auth.handleRequest({ req, res });
		const key = await auth.useKey("username", username, password);
		const session = await auth.createSession(key.userId);
		authRequest.setSession(session); // set cookie
		return res.redirect(302, "/"); // redirect to profile page
	} catch {
		// invalid username/password
		return res.status(400).json({});
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

```ts
import Link from "next/link";
import { useRouter } from "next/router";
import React from "react";

// ADD:
import { auth } from "../lib/lucia";
import type { GetServerSidePropsContext, GetServerSidePropsResult } from "next";
```

```ts
// pages/login.tsx
export const getServerSideProps = async (
	context: GetServerSidePropsContext
): Promise<GetServerSidePropsResult<{}>> => {
	const authRequest = auth.handleRequest(context);
	const { session } = await authRequest.validateUser();
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

This page will be the root page (`/`). This route will display the authenticated user's data.

### Get current user

Create `pages/index.tsx` and set up the page and `getServerSideProps()`. Redirect the user to `/login` if they are unauthenticated.

```tsx
import React from "react";

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
	const authRequest = auth.handleRequest(context);
	const { user } = await authRequest.validateUser();
	if (!user) {
		return {
			redirect: {
				destination: "/login",
				permanent: false
			}
		};
	}
	return {
		props: {
			user
		}
	};
};

export default (
	props: InferGetServerSidePropsType<typeof getServerSideProps>
) => {
	return (
		<>
			<h1>Profile</h1>
			<div>
				<p>User id: {props.user?.userId}</p>
				<p>Username: {props.user?.username}</p>
			</div>
		</>
	);
};
```

### Sign out

Create `pages/api/logout.ts`. This API route will handle sign-outs by invalidating the current session and removing the session cookie.

```ts
import { auth } from "../../auth/lucia";

import type { NextApiRequest, NextApiResponse } from "next";

type Data = {
	error?: string;
};

export default async (req: NextApiRequest, res: NextApiResponse<Data>) => {
	if (req.method !== "POST")
		return res.status(404).json({ error: "Not found" });
	const authRequest = auth.handleRequest({ req, res });
	const { session } = await authRequest.validateUser();
	if (!session) return res.status(401).json({ error: "Unauthorized" });
	await auth.invalidateSession(session.sessionId);
	authRequest.setSession(null); // setting to null removes cookie
	return res.redirect(302, "/");
};
```

This can be called with a fetch request:

```tsx
<button
	onClick={async () => {
		try {
			await fetch("/api/logout", {
				method: "POST"
			});
			router.push("/login"); // login page
		} catch (e) {
			console.log(e);
		}
	}}
>
	Sign out
</button>
```

## 6. Validate requests

`AuthRequest` can also be used inside API routes:

```ts
import { auth } from "../../lib/lucia";
import type { NextApiRequest, NextApiResponse } from "next";

export default async (req: NextApiRequest, res: NextApiResponse) => {
	const authRequest = auth.handleRequest({ req, res });
	const { session } = await authRequest.validateUser();
	// ...
};
```
