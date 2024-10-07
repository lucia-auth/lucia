---
title: "Username and password auth in Next.js App Router"
---

# Username and password auth in Next.js App Router

Before starting, make sure you've set up your database as described in the [Getting started](/getting-started/nextjs-app) page.

An [example project](https://github.com/lucia-auth/examples/tree/main/nextjs-app/username-and-password) based on this tutorial is also available. You can clone the example locally or [open it in StackBlitz](https://stackblitz.com/github/lucia-auth/examples/tree/main/nextjs-app/username-and-password).

```
npx degit https://github.com/lucia-auth/examples/nextjs-app/username-and-password <directory_name>
```

## Update database

Add a `username` and `password_hash` column to your user table.

| column          | type     | attributes |
| --------------- | -------- | ---------- |
| `username`      | `string` | unique     |
| `password_hash` | `string` |            |

Create a `DatabaseUserAttributes` interface in the module declaration and add your database columns. By default, Lucia will not expose any database columns to the `User` type. To add a `username` field to it, use the `getUserAttributes()` option.

```ts
import { Lucia } from "lucia";

export const lucia = new Lucia(adapter, {
	sessionCookie: {
		expires: false,
		attributes: {
			secure: process.env.NODE_ENV === "production"
		}
	},
	getUserAttributes: (attributes) => {
		return {
			// attributes has the type of DatabaseUserAttributes
			username: attributes.username
		};
	}
});

declare module "lucia" {
	interface Register {
		Lucia: typeof lucia;
		DatabaseUserAttributes: DatabaseUserAttributes;
	}
}

interface DatabaseUserAttributes {
	username: string;
}
```

## Sign up user

Create `app/signup/page.tsx` and set up a basic form and action.

```tsx
export default async function Page() {
	return (
		<>
			<h1>Create an account</h1>
			<form action={signup}>
				<label htmlFor="username">Username</label>
				<input name="username" id="username" />
				<br />
				<label htmlFor="password">Password</label>
				<input type="password" name="password" id="password" />
				<br />
				<button>Continue</button>
			</form>
		</>
	);
}

async function signup(_: any, formData: FormData): Promise<ActionResult> {}

interface ActionResult {
	error: string;
}
```

In the form action, first do a very basic input validation. Hash the password, generate a new user ID, and create a new user. If successful, create a new session with `Lucia.createSession()` and set a new session cookie.

```tsx
import { db } from "@/lib/db";
import { hash } from "@node-rs/argon2";
import { cookies } from "next/headers";
import { lucia } from "@/lib/auth";
import { redirect } from "next/navigation";
import { generateIdFromEntropySize } from "lucia";

export default async function Page() {}

async function signup(_: any, formData: FormData): Promise<ActionResult> {
	"use server";
	const username = formData.get("username");
	// username must be between 4 ~ 31 characters, and only consists of lowercase letters, 0-9, -, and _
	// keep in mind some database (e.g. mysql) are case insensitive
	if (
		typeof username !== "string" ||
		username.length < 3 ||
		username.length > 31 ||
		!/^[a-z0-9_-]+$/.test(username)
	) {
		return {
			error: "Invalid username"
		};
	}
	const password = formData.get("password");
	if (typeof password !== "string" || password.length < 6 || password.length > 255) {
		return {
			error: "Invalid password"
		};
	}

	const passwordHash = await hash(password, {
		// recommended minimum parameters
		memoryCost: 19456,
		timeCost: 2,
		outputLen: 32,
		parallelism: 1
	});
	const userId = generateIdFromEntropySize(10); // 16 characters long

	// TODO: check if username is already used
	await db.table("user").insert({
		id: userId,
		username: username,
		password_hash: passwordHash
	});

	const session = await lucia.createSession(userId, {});
	const sessionCookie = lucia.createSessionCookie(session.id);
	cookies().set(sessionCookie.name, sessionCookie.value, sessionCookie.attributes);
	return redirect("/");
}
```

Argon2id should be your first choice for hashing passwords, followed by Scrypt and Bcrypt. Hashing is by definition computationally expensive so you should use the most performant option for your runtime.

-   For Node.js we recommend using [`@node-rs/argon2`](https://github.com/napi-rs/node-rs).
-   For Bun, we recommend using [`Bun.password`](https://bun.sh/docs/api/hashing).
-   Use Deno-specific packages for Deno.
-   For other runtimes (e.g. Cloudflare Workers), your choice is very limited. [`@noble/hashes`](https://github.com/paulmillr/noble-hashes) provides pure-js implementations of various hashing algorithms, but because it's written in JS, you may hit into CPU limitations of your service. If possible, avoid these runtimes when you need to hash passwords.

Make sure to check the [recommended minimum parameters for your hashing algorithm](https://thecopenhagenbook.com/password-authentication#password-storage).

### @node-rs/argon2

If you're using `@node-rs/argon2`, make sure to set it as an external dependency to prevent it from getting bundled. This package [does NOT work with Turbopack](https://github.com/vercel/next.js/issues/63850).

```ts
// next.config.js
const nextConfig = {
	experimental: {
		serverComponentsExternalPackages: ["@node-rs/argon2"]
	}
};

module.exports = nextConfig;
```

## Sign in user

Create `app/login/page.tsx` and set up a basic form and action.

```tsx
// app/login/page.tsx
export default async function Page() {
	return (
		<>
			<h1>Sign in</h1>
			<form action={login}>
				<label htmlFor="username">Username</label>
				<input name="username" id="username" />
				<br />
				<label htmlFor="password">Password</label>
				<input type="password" name="password" id="password" />
				<br />
				<button>Continue</button>
			</form>
		</>
	);
}

async function login(_: any, formData: FormData): Promise<ActionResult> {}

interface ActionResult {
	error: string;
}
```

In the form action, first do a very basic input validation. Get the user with the username and verify the password. If successful, create a new session with `Lucia.createSession()` and set a new session cookie.

```tsx
import { verify } from "@node-rs/argon2";
import { cookies } from "next/headers";
import { lucia } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function Page() {}

async function login(_: any, formData: FormData): Promise<ActionResult> {
	"use server";
	const username = formData.get("username");
	if (
		typeof username !== "string" ||
		username.length < 3 ||
		username.length > 31 ||
		!/^[a-z0-9_-]+$/.test(username)
	) {
		return {
			error: "Invalid username"
		};
	}
	const password = formData.get("password");
	if (typeof password !== "string" || password.length < 6 || password.length > 255) {
		return {
			error: "Invalid password"
		};
	}

	const existingUser = await db
		.table("user")
		.where("username", "=", username.toLowerCase())
		.get();
	if (!existingUser) {
		// NOTE:
		// Returning immediately allows malicious actors to figure out valid usernames from response times,
		// allowing them to only focus on guessing passwords in brute-force attacks.
		// As a preventive measure, you may want to hash passwords even for invalid usernames.
		// However, valid usernames can be already be revealed with the signup page among other methods.
		// It will also be much more resource intensive.
		// Since protecting against this is non-trivial,
		// it is crucial your implementation is protected against brute-force attacks with login throttling etc.
		// If usernames are public, you may outright tell the user that the username is invalid.
		return {
			error: "Incorrect username or password"
		};
	}

	const validPassword = await verify(existingUser.password_hash, password, {
		memoryCost: 19456,
		timeCost: 2,
		outputLen: 32,
		parallelism: 1
	});
	if (!validPassword) {
		return {
			error: "Incorrect username or password"
		};
	}

	const session = await lucia.createSession(existingUser.id, {});
	const sessionCookie = lucia.createSessionCookie(session.id);
	cookies().set(sessionCookie.name, sessionCookie.value, sessionCookie.attributes);
	return redirect("/");
}
```

## Validate requests

Create `validateRequest()`. This will check for the session cookie, validate it, and set a new cookie if necessary. Make sure to catch errors when setting cookies and wrap the function with `cache()` to prevent unnecessary database calls. To learn more, see the [Validating requests](/guides/validate-session-cookies/nextjs-app) page.

CSRF protection should be implemented but Next.js handles it when using form actions (but not for Route Handlers).

```ts
import { cookies } from "next/headers";
import { cache } from "react";

import type { Session, User } from "lucia";

export const lucia = new Lucia();

export const validateRequest = cache(
	async (): Promise<{ user: User; session: Session } | { user: null; session: null }> => {
		const sessionId = cookies().get(lucia.sessionCookieName)?.value ?? null;
		if (!sessionId) {
			return {
				user: null,
				session: null
			};
		}

		const result = await lucia.validateSession(sessionId);
		// next.js throws when you attempt to set cookie when rendering page
		try {
			if (result.session && result.session.fresh) {
				const sessionCookie = lucia.createSessionCookie(result.session.id);
				cookies().set(sessionCookie.name, sessionCookie.value, sessionCookie.attributes);
			}
			if (!result.session) {
				const sessionCookie = lucia.createBlankSessionCookie();
				cookies().set(sessionCookie.name, sessionCookie.value, sessionCookie.attributes);
			}
		} catch {}
		return result;
	}
);
```

This function can then be used in server components and form actions to get the current session and user.

```tsx
import { redirect } from "next/navigation";
import { validateRequest } from "@/lib/auth";

export default async function Page() {
	const { user } = await validateRequest();
	if (!user) {
		return redirect("/login");
	}
	return <h1>Hi, {user.username}!</h1>;
}
```

> Note: This code is not suitable for use in `layout.tsx` files. Layouts do not re-render on page transitions, so the authentication check won't run for each route change.

## Sign out

Sign out users by invalidating their session with `Lucia.invalidateSession()`. Make sure to remove their session cookie by setting a blank session cookie created with `Lucia.createBlankSessionCookie()`.

```tsx
import { lucia, validateRequest } from "@/lib/auth";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";

export default async function Page() {
	return (
		<form action={logout}>
			<button>Sign out</button>
		</form>
	);
}

async function logout(): Promise<ActionResult> {
	"use server";
	const { session } = await validateRequest();
	if (!session) {
		return {
			error: "Unauthorized"
		};
	}

	await lucia.invalidateSession(session.id);

	const sessionCookie = lucia.createBlankSessionCookie();
	cookies().set(sessionCookie.name, sessionCookie.value, sessionCookie.attributes);
	return redirect("/login");
}
```
