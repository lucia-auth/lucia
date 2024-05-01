---
title: "Password basics"
---

# Password basics

This page covers how to implement a password-based auth with Lucia. If you're looking for a step-by-step, framework-specific tutorial, you may want to check out the [Username and password](/tutorials/username-and-password) tutorial. Keep in mind that email-based auth requires more than just passwords!

## Update database

Add a unique `email` and `password_hash` column to the user table.

| column          | type     | attributes |
| --------------- | -------- | ---------- |
| `email`         | `string` | unique     |
| `password_hash` | `string` |            |

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
			// we don't need to expose the password hash!
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
import { generateIdFromEntropySize } from "lucia";
import { hash } from "@node-rs/argon2";

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

	const passwordHash = await hash(password, {
		// recommended minimum parameters
		memoryCost: 19456,
		timeCost: 2,
		outputLen: 32,
		parallelism: 1
	});
	const userId = generateIdFromEntropySize(10); // 16 characters long

	try {
		await db.table("user").insert({
			id: userId,
			email,
			password_hash: passwordHash
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

Argon2id should be your first choice for hashing passwords, followed by Scrypt and Bcrypt. Hashing is by definition computationally expensive so you should use the most performant option for your runtime.

-   For Node.js we recommend using [`@node-rs/argon2`](https://github.com/napi-rs/node-rs).
-   For Bun, we recommend using [`Bun.password`](https://bun.sh/docs/api/hashing).
-   Use Deno-specific packages for Deno.
-   For other runtimes (e.g. Cloudflare Workers), your choice is very limited. [`@noble/hashes`](https://github.com/paulmillr/noble-hashes) provides pure-js implementations of various hashing algorithms, but because it's written in JS, you may hit into CPU limitations of your service. If possible, avoid these runtimes when you need to hash passwords.

Make sure to check the [recommended minimum parameters for your hashing algorithm](https://thecopenhagenbook.com/password-authentication#password-storage).

If you're migrating from Lucia v2, you should use [`LegacyScrypt`](/reference/main/LegacyScrypt).

```ts
import { LegacyScrypt } from "lucia";
```

## Sign in user

Create a `/login` route. This will accept POST requests with an email and password. Get the user with the email, verify the password against the hash, and create a new session.

```ts
import { lucia } from "./auth.js";
import { verify } from "@node-rs/argon2";

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
		// Since protecting against this is non-trivial,
		// it is crucial your implementation is protected against brute-force attacks with login throttling etc.
		// If emails/usernames are public, you may outright tell the user that the username is invalid.
		return new Response("Invalid email or password", {
			status: 400
		});
	}

	const validPassword = await verify(user.password_hash, password, {
		memoryCost: 19456,
		timeCost: 2,
		outputLen: 32,
		parallelism: 1
	});
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
