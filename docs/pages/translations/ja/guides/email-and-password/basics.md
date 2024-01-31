---
title: "Password basics"
---

# Password basics

This page covers how to implement a password-based auth with Lucia. If you're looking for a step-by-step, framework-specific tutorial, you may want to check out the [Username and password](/tutorials/username-and-password) tutorial. Keep in mind that email-based auth requires more than just passwords!

## Update database

Add a unique `email` and `hashed_password` column to the user table.

| column            | type     | attributes |
| ----------------- | -------- | ---------- |
| `email`           | `string` | unique     |
| `hashed_password` | `string` |            |

Declare the type with `DatabaseUserAttributes` and add the attributes to the user object using the `getUserAttributes()` configuration.

```ts
// auth.ts
import { Lucia } from "lucia";

export const lucia = new Lucia(adapter, {
	sessionCookie: {
		attributes: {
			secure: env === "PRODUCTION" // set `Secure` flag in HTTPS
		}
	},
	getUserAttributes: (attributes) => {
		return {
			// we don't need to expose the hashed password!
			email: attributes.email
		};
	}
});

declare module "lucia" {
	interface Register {
		Lucia: typeof lucia;
		DatabaseUserAttributes: {
			email: string;
		};
	}
}
```

## Email check

Before creating routes, create a basic utility to verify emails. Emails are notoriously complicated, so here we're just checking if an `@` exists with at least 1 character on each side. We just need to check for obvious typos here. For verifying emails, see one of the email verification guides.

```ts
export function isValidEmail(email: string): boolean {
	return /.+@.+/.test(email);
}
```

## Register user

Create a `/signup` route. This will accept POST requests with an email and password. Hash the password, create a new user, and create a new session.

```ts
import { lucia } from "./auth.js";
import { generateId } from "lucia";
import { Argon2id } from "oslo/password";

app.post("/signup", async (request: Request) => {
	const formData = await request.formData();
	const email = formData.get("email");
	if (!email || typeof email !== "string" || !isValidEmail(email)) {
		return new Response("Invalid email", {
			status: 400
		});
	}
	const password = formData.get("password");
	if (!password || typeof password !== "string" || password.length < 6) {
		return new Response("Invalid password", {
			status: 400
		});
	}

	const hashedPassword = await new Argon2id().hash(password);
	const userId = generateId(15);

	try {
		await db.table("user").insert({
			id: userId,
			email,
			hashed_password: hashedPassword
		});

		const session = await lucia.createSession(userId, {});
		const sessionCookie = lucia.createSessionCookie(session.id);
		return new Response(null, {
			status: 302,
			headers: {
				Location: "/",
				"Set-Cookie": sessionCookie.serialize()
			}
		});
	} catch {
		// db error, email taken, etc
		return new Response("Email already used", {
			status: 400
		});
	}
});
```

### Hashing passwords

`oslo/password` currently provides [`Argon2id`](https://oslo.js.org/reference/password/Argon2id), [`Scrypt`](https://oslo.js.org/reference/password/Scrypt), and [`Bcrypt`](https://oslo.js.org/reference/password/Bcrypt). These rely on the fastest available libraries but only work in Node.js. Passwords are salted and hashed using settings recommended by OWASP.

```ts
import { Argon2id, Scrypt, Bcrypt } from "oslo/password";
```

For Bun, we recommend using [`Bun.password`](https://bun.sh/docs/api/hashing), which also uses Argon2id by default. For other runtimes, Lucia provides a pure-JS implementation of Scrypt with [`Scrypt`](/reference/main/Scrypt) that works in any environment. However, we do not recommend this for Node.js as it can be 2~3 times slower than the Node-only version. If you're migrating from Lucia v2, you should use [`LegacyScrypt`](/reference/main/LegacyScrypt).

```ts
import { Scrypt, LegacyScrypt } from "lucia";
```

## Sign in user

Create a `/login` route. This will accept POST requests with an email and password. Get the user with the email, verify the password against the hash, and create a new session.

```ts
import { lucia } from "./auth.js";
import { generateId } from "lucia";
import { Argon2id } from "oslo/password";

app.post("/login", async (request: Request) => {
	const formData = await request.formData();
	const email = formData.get("email");
	if (!email || typeof email !== "string") {
		return new Response("Invalid email", {
			status: 400
		});
	}
	const password = formData.get("password");
	if (!password || typeof password !== "string") {
		return new Response(null, {
			status: 400
		});
	}

	const user = await db.table("user").where("email", "=", email).get();

	if (!user) {
		// NOTE:
		// Returning immediately allows malicious actors to figure out valid emails from response times,
		// allowing them to only focus on guessing passwords in brute-force attacks.
		// As a preventive measure, you may want to hash passwords even for invalid emails.
		// However, valid emails can be already be revealed with the signup page
		// and a similar timing issue can likely be found in password reset implementation.
		// It will also be much more resource intensive.
		// Since protecting against this is none-trivial,
		// it is crucial your implementation is protected against brute-force attacks with login throttling etc.
		// If emails/usernames are public, you may outright tell the user that the username is invalid.
		return new Response("Invalid email or password", {
			status: 400
		});
	}

	const validPassword = await new Argon2id().verify(user.hashed_password, password);
	if (!validPassword) {
		return new Response("Invalid email or password", {
			status: 400
		});
	}

	const session = await lucia.createSession(user.id, {});
	const sessionCookie = lucia.createSessionCookie(session.id);
	return new Response(null, {
		status: 302,
		headers: {
			Location: "/",
			"Set-Cookie": sessionCookie.serialize()
		}
	});
});
```
