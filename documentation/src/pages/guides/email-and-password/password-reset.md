---
layout: "@layouts/DocLayout.astro"
title: "Password reset"
---

Allow users to reset their password by sending them a reset link to their inbox.

## Update database

Create a table for storing for password reset tokens.

| column       | type     | attributes  |
| ------------ | -------- | ----------- |
| `id`         | `string` | primary key |
| `user_id`    | `string` |             |
| `expires_at` | `Date`   |             |

## Create verification token

The token should be valid for at most few hours.

```ts
import { TimeSpan, createDate } from "oslo";

async function createPasswordResetToken(userId: string): Promise<string> {
	// optionally invalidate all existing tokens
	await db.table("password_reset_token").where("user_id", "=", userId).deleteAll();
	const tokenId = generateId(40);
	await db.table("password_reset_token").insert({
		id: tokenId,
		user_id: userId,
		expires_at: createDate(new TimeSpan(2, "h"))
	});
	return tokenId;
}
```

When a user requests a password reset email, check if the email is valid and create a new link.

```ts
import { generateId } from "lucia";
import { encodeHex } from "oslo/encoding";

app.post("/reset-password", async () => {
	let email: string;

	// ...

	const user = await db.table("user").where("email", "=", email).get();
	if (!user || !user.email_verified) {
		return new Response("Invalid email", {
			status: 400
		});
	}

	const verificationToken = await createPasswordResetToken(userId);
	const verificationLink = "http://localhost:3000/reset-password/" + verificationToken;

	await sendPasswordResetToken(email, verificationLink);
	return new Response(null, {
		status: 200
	});
});
```

Make sure to implement rate limiting based on IP addresses.

## Verify token

Extract the verification token from the URL and validate by checking the expiration date. If the token is valid, invalidate all existing user sessions, update the database, and create a new session.

```ts
import { isWithinExpiration } from "oslo";

app.post("/reset-password/*", async () => {
	let password: string;

	// ...

	// there are better ways to do this - check your framework's API
	const verificationToken = request.url.replace("http://localhost:3000/reset-password/", "");

	await db.beginTransaction();
	const token = await db.table("password_reset_token").where("id", "=", verificationToken).get();
	await db.table("password_reset_token").where("id", "=", verificationToken).delete();
	await db.commit();

	if (!token) {
		return new Response(400);
	}
	if (!isWithinExpiration(token.expires_at)) {
		await db.table("password_reset_token").where("id", "=", token.id).delete();
		return new Response(400);
	}

	await lucia.invalidateUserSessions(user.id);
	const hashedPassword = new Argon2id().hash(password);
	await db.table("user").where("id", "=", user.id).update({
		hashed_password: hashedPassword
	});

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
