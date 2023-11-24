---
title: "Password reset links"
description: "Learn how to implement password reset using reset links"
---

This guide expects access to the user's verified email. See [Sign in with email and password with verification links](/guidebook/email-verification-links) guide to learn how to verify the user's email, and email and password authentication in general.

```ts
// lucia.ts
export const auth = lucia({
	adapter: ADAPTER,
	env: "DEV",
	middleware: web(),
	sessionCookie: {
		expires: false
	},

	getUserAttributes: (data) => {
		return {
			email: data.email,
			emailVerified: data.email_verified
		};
	}
});

export type Auth = typeof auth;
```

## Database

### Password reset token

Create a new `password_reset_token` table. This will have 3 fields.

| name      | type                        | primary | references | description                         |
| --------- | --------------------------- | :-----: | ---------- | ----------------------------------- |
| `id`      | `string`                    |    ✓    |            | Token to send inside the reset link |
| `expires` | `bigint` (unsigned 8 bytes) |         |            | Expiration (in milliseconds)        |
| `user_id` | `string`                    |         | `user(id)` |                                     |

We'll be storing the expiration date as a `bigint` since Lucia uses handles expiration in milliseconds, but you can of course store it in seconds or the native `timestamp` type. Just make sure to adjust the expiration check accordingly.

## Password reset tokens

The token will be sent as part of the reset link.

```
http://localhost:<port>/password-reset/<token>
```

When a user clicks the link, we prompt the user to enter their new password. When a user submits that form, we'll validate the token stored in the url and update the password of the user's key.

### Create new tokens

`generatePasswordResetToken()` will first check if a reset token already exists for the user. If it does, it will re-use the token if the expiration is over 1 hour away (half the expiration of 2 hours). If not, it will create a new token using [`generateRandomString()`](/reference/lucia/modules/utils#generaterandomstring) with a length of 63. The length is arbitrary, and anything around or longer than 64 characters should be sufficient (recommend minimum is 40).

```ts
// token.ts
import { generateRandomString, isWithinExpiration } from "lucia/utils";

const EXPIRES_IN = 1000 * 60 * 60 * 2; // 2 hours

export const generatePasswordResetToken = async (userId: string) => {
	const storedUserTokens = await db
		.table("password_reset_token")
		.where("user_id", "=", userId)
		.getAll();
	if (storedUserTokens.length > 0) {
		const reusableStoredToken = storedUserTokens.find((token) => {
			// check if expiration is within 1 hour
			// and reuse the token if true
			return isWithinExpiration(Number(token.expires) - EXPIRES_IN / 2);
		});
		if (reusableStoredToken) return reusableStoredToken.id;
	}
	const token = generateRandomString(63);
	await db
		.insertInto("password_reset_token")
		.values({
			id: token,
			expires: new Date().getTime() + EXPIRES_IN,
			user_id: userId
		})
		.executeTakeFirst();
	return token;
};
```

### Validate tokens

`validatePasswordResetToken()` will get the token and delete the token. We recommend handling this in a transaction or a batched query. It thens check the expiration with [`isWithinExpiration()`](/reference/lucia/modules/utils#iswithinexpiration), provided by Lucia, which checks if the current time is within the provided expiration time (in milliseconds).

It will throw if the token is invalid.

```ts
// token.ts
import { generateRandomString, isWithinExpiration } from "lucia/utils";

const EXPIRES_IN = 1000 * 60 * 60 * 2; // 2 hours

export const generatePasswordResetToken = async (userId: string) => {
	// ...
};

export const validatePasswordResetToken = async (token: string) => {
	const storedToken = await db.transaction().execute(async (trx) => {
		const storedToken = await trx
			.table("password_reset_token")
			.where("id", "=", token)
			.get();
		if (!storedToken) throw new Error("Invalid token");
		await trx
			.table("password_reset_token")
			.where("id", "=", storedToken.id)
			.delete();
		return storedToken;
	});
	const tokenExpires = Number(storedToken.expires); // bigint => number conversion
	if (!isWithinExpiration(tokenExpires)) {
		throw new Error("Expired token");
	}
	return storedToken.user_id;
};
```

## Send password reset link

Lucia allows us to use raw database queries when needed, for example checking the validity of an email. If the email is valid, create a new password reset link and send it to the user's inbox.

```ts
import { generatePasswordResetToken } from "./token.js";

post("/password-reset", async (request: Request) => {
	const { email } = await request.json();
	// check email
	if (!isValidEmail(email)) {
		return new Response("Invalid email", {
			status: 400
		});
	}
	try {
		// query from user table
		const storedUser = await db
			.table("user")
			.where("email", "=", email.toLowerCase())
			.get();
		if (!storedUser) {
			return new Response("User does not exist", {
				status: 400
			});
		}
		const token = await generatePasswordResetToken(storedUser.id);
		await sendPasswordResetLink(token);
		return new Response();
	} catch (e) {
		return new Response("An unknown error occurred", {
			status: 500
		});
	}
});
```

## Reset password

Get the token from the url and validate the token with `validatePasswordResetToken()`. Update the key password with [`Auth.updateKeyPassword()`](/reference/lucia/interfaces/auth#updatekeypassword), and optionally verify the user's email. **Make sure you invalidate all user sessions with [`Auth.invalidateAllUserSessions()`](/reference/lucia/interfaces/auth#invalidateallusersessions) before updating the password.**

```ts
import { auth } from "./lucia.js";
import { validatePasswordResetToken } from "./token.js";

post("/password-reset/[token]", async (request: Request) => {
	const { password } = await request.json();
	if (
		typeof password !== "string" ||
		password.length < 6 ||
		password.length > 255
	) {
		return new Response("Invalid password", {
			status: 400
		});
	}
	try {
		const { token } = req.params;
		const userId = await validatePasswordResetToken(token);
		let user = await auth.getUser(userId);
		await auth.invalidateAllUserSessions(user.userId);
		await auth.updateKeyPassword("email", user.email, password);

		if (!user.emailVerified) {
			user = await auth.updateUserAttributes(user.userId, {
				email_verified: Number(true)
			});
		}

		const session = await auth.createSession({
			userId: user.userId,
			attributes: {}
		});
		const sessionCookie = auth.createSessionCookie(session);
		return new Response(null, {
			status: 302,
			headers: {
				Location: "/",
				"Set-Cookie": sessionCookie.serialize()
			}
		});
	} catch (e) {
		return new Response("Invalid or expired password reset link", {
			status: 400
		});
	}
});
```
