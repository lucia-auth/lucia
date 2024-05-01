---
title: "Tutorial: Username and password auth in Next.js Pages router"
---

# Tutorial: Username and password auth in Next.js Pages router

Before starting, make sure you've set up your database and middleware as described in the [Getting started](/getting-started/nextjs-pages) page.

An [example project](https://github.com/lucia-auth/examples/tree/main/nextjs-pages/username-and-password) based on this tutorial is also available. You can clone the example locally or [open it in StackBlitz](https://stackblitz.com/github/lucia-auth/examples/tree/main/nextjs-pages/username-and-password).

```
npx degit https://github.com/lucia-auth/examples/tree/main/nextjs-pages/username-and-password <directory_name>
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

Create `pages/signup.tsx` and set up a basic form.

```tsx
// pages/signup.tsx
import { useRouter } from "next/router";
import type { FormEvent } from "react";

export default function Page() {
	const router = useRouter();

	async function onSubmit(e: FormEvent<HTMLFormElement>) {
		e.preventDefault();
		const formElement = e.target as HTMLFormElement;
		const response = await fetch(formElement.action, {
			method: formElement.method,
			body: JSON.stringify(Object.fromEntries(new FormData(formElement).entries())),
			headers: {
				"Content-Type": "application/json"
			}
		});
		if (response.ok) {
			router.push("/");
		}
	}

	return (
		<>
			<h1>Create an account</h1>
			<form method="post" action="/api/signup" onSubmit={onSubmit}>
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
```

Create an API route in `pages/api/signup.ts`. First, do a very basic input validation. Hash the password, generate a new user ID, and create a new user. If successful, create a new session with `Lucia.createSession()` and set a new session cookie.

```ts
// pages/api/signup.ts
import { lucia } from "@/lib/auth";
import { generateIdFromEntropySize } from "lucia";
import { hash } from "@node-rs/argon2";

import type { NextApiRequest, NextApiResponse } from "next";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
	if (req.method !== "POST") {
		res.status(404).end();
		return;
	}

	const body: null | Partial<{ username: string; password: string }> = req.body;
	const username = body?.username;
	if (
		!username ||
		username.length < 3 ||
		username.length > 31 ||
		!/^[a-z0-9_-]+$/.test(username)
	) {
		res.status(400).json({
			error: "Invalid username"
		});
		return;
	}
	const password = body?.password;
	if (!password || password.length < 6 || password.length > 255) {
		res.status(400).json({
			error: "Invalid password"
		});
		return;
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
	res.appendHeader("Set-Cookie", lucia.createSessionCookie(session.id).serialize())
		.status(200)
		.end();
}
```

Argon2id should be your first choice for hashing passwords, followed by Scrypt and Bcrypt. Hashing is by definition computationally expensive so you should use the most performant option for your runtime.

-   For Node.js we recommend using [`@node-rs/argon2`](https://github.com/napi-rs/node-rs).
-   For Bun, we recommend using [`Bun.password`](https://bun.sh/docs/api/hashing).
-   Use Deno-specific packages for Deno.
-   For other runtimes (e.g. Cloudflare Workers), your choice is very limited. [`@noble/hashes`](https://github.com/paulmillr/noble-hashes) provides pure-js implementations of various hashing algorithms, but because it's written in JS, you may hit into CPU limitations of your service. If possible, avoid these runtimes when you need to hash passwords.

Make sure to check the [recommended minimum parameters for your hashing algorithm](https://thecopenhagenbook.com/password-authentication#password-storage).

## Sign in user

Create `pages/login.tsx` and set up a basic form.

```tsx
// pages/login.tsx
import { useRouter } from "next/router";
import type { FormEvent } from "react";

export default function Page() {
	const router = useRouter();

	async function onSubmit(e: FormEvent<HTMLFormElement>) {
		e.preventDefault();
		const formElement = e.target as HTMLFormElement;
		const response = await fetch(formElement.action, {
			method: formElement.method,
			body: JSON.stringify(Object.fromEntries(new FormData(formElement).entries())),
			headers: {
				"Content-Type": "application/json"
			}
		});
		if (response.ok) {
			router.push("/");
		}
	}

	return (
		<>
			<h1>Sign in</h1>
			<form method="post" action="/api/login" onSubmit={onSubmit}>
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
```

Create an API route as `pages/api/signup.ts`. First, do a very basic input validation. Get the user with the username and verify the password. If successful, create a new session with `Lucia.createSession()` and set a new session cookie.

```ts
// pages/api/login.ts
import { verify } from "@node-rs/argon2";
import { lucia } from "@/lib/auth";

import type { NextApiRequest, NextApiResponse } from "next";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
	if (req.method !== "POST") {
		res.status(404).end();
		return;
	}

	const body: null | Partial<{ username: string; password: string }> = req.body;
	const username = body?.username;
	if (
		!username ||
		username.length < 3 ||
		username.length > 31 ||
		!/^[a-z0-9_-]+$/.test(username)
	) {
		res.status(400).json({
			error: "Invalid username"
		});
		return;
	}
	const password = body?.password;
	if (!password || password.length < 6 || password.length > 255) {
		res.status(400).json({
			error: "Invalid password"
		});
		return;
	}

	const existingUser = await db
		.table("username")
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
		res.status(400).json({
			error: "Incorrect username or password"
		});
		return;
	}

	const validPassword = await verify(existingUser.password, password, {
		memoryCost: 19456,
		timeCost: 2,
		outputLen: 32,
		parallelism: 1
	});
	if (!validPassword) {
		res.status(400).json({
			error: "Incorrect username or password"
		});
		return;
	}

	const session = await lucia.createSession(existingUser.id, {});
	res.appendHeader("Set-Cookie", lucia.createSessionCookie(session.id).serialize())
		.status(200)
		.end();
}
```

## Validate requests

Create `validateRequest()`. This will check for the session cookie, validate it, and set a new cookie if necessary. To learn more, see the [Validating requests](/guides/validate-session-cookies/nextjs-pages) page.

CSRF protection should be implemented and you should already have a middleware for it.

```ts
import type { Session, User } from "lucia";
import type { IncomingMessage, ServerResponse } from "http";

export const lucia = new Lucia();

export async function validateRequest(
	req: IncomingMessage,
	res: ServerResponse
): Promise<{ user: User; session: Session } | { user: null; session: null }> {
	const sessionId = lucia.readSessionCookie(req.headers.cookie ?? "");
	if (!sessionId) {
		return {
			user: null,
			session: null
		};
	}
	const result = await lucia.validateSession(sessionId);
	if (result.session && result.session.fresh) {
		res.appendHeader("Set-Cookie", lucia.createSessionCookie(result.session.id).serialize());
	}
	if (!result.session) {
		res.appendHeader("Set-Cookie", lucia.createBlankSessionCookie().serialize());
	}
	return result;
}
```

This function can then be used in both `getServerSideProps()` and API routes.

```tsx
import { validateRequest } from "@/lib/auth";

import type {
	GetServerSidePropsContext,
	GetServerSidePropsResult,
	InferGetServerSidePropsType
} from "next";
import type { User } from "lucia";

export async function getServerSideProps(context: GetServerSidePropsContext): Promise<
	GetServerSidePropsResult<{
		user: User;
	}>
> {
	const { user } = await validateRequest(context.req, context.res);
	if (!user) {
		return {
			redirect: {
				permanent: false,
				destination: "/login"
			}
		};
	}
	return {
		props: {
			user
		}
	};
}

export default function Page({ user }: InferGetServerSidePropsType<typeof getServerSideProps>) {
	return <h1>Hi, {user.username}!</h1>;
}
```

## Sign out

Sign out users by invalidating their session with `Lucia.invalidateSession()`. Make sure to remove their session cookie by setting a blank session cookie created with `Lucia.createBlankSessionCookie()`.

```ts
// pages/api/logout.ts
import { lucia, validateRequest } from "@/lib/auth";

import type { NextApiRequest, NextApiResponse } from "next";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
	if (req.method !== "POST") {
		res.status(404).end();
		return;
	}
	const { session } = await validateRequest(req, res);
	if (!session) {
		res.status(401).end();
		return;
	}
	await lucia.invalidateSession(session.id);
	res.setHeader("Set-Cookie", lucia.createBlankSessionCookie().serialize()).status(200).end();
}
```

```tsx
import { useRouter } from "next/router";

import type { FormEvent } from "react";

export default function Page({ user }: InferGetServerSidePropsType<typeof getServerSideProps>) {
	const router = useRouter();

	async function onSubmit(e: FormEvent<HTMLFormElement>) {
		e.preventDefault();
		const formElement = e.target as HTMLFormElement;
		await fetch(formElement.action, {
			method: formElement.method
		});
		router.push("/login");
	}

	return (
		<form method="post" action="/api/logout" onSubmit={onSubmit}>
			<button>Sign out</button>
		</form>
	);
}
```
