---
title: "Password reset"
---

# Password reset

Allow users to reset their password by sending them a reset link to their inbox.

We recommend reading through the [password reset guide](https://thecopenhagenbook.com/password-reset) in the Copenhagen Book.

## Update database

Create a table for storing for password reset tokens.

| column       | type     | attributes |
| ------------ | -------- | ---------- |
| `token_hash` | `string` | unique     |
| `user_id`    | any      |            |
| `expires_at` | `Date`   |            |

## Create verification token

The token should be valid for at most few hours. The token should be hashed before storage as it essentially is a password. SHA-256 can be used here since the token is long and random, unlike user passwords.

```ts
import { TimeSpan, createDate } from "oslo";
import { sha256 } from "oslo/crypto";
import { encodeHex } from "oslo/encoding";
import { generateIdFromEntropySize } from "lucia";

async function createPasswordResetToken(userId: string): Promise<string> {
	// optionally invalidate all existing tokens
	await db.table("password_reset_token").where("user_id", "=", userId).deleteAll();
	const tokenId = generateIdFromEntropySize(25); // 40 character
	const tokenHash = encodeHex(await sha256(new TextEncoder().encode(tokenId)));
	await db.table("password_reset_token").insert({
		token_hash: tokenHash,
		user_id: userId,
		expires_at: createDate(new TimeSpan(2, "h"))
	});
	return tokenId;
}
```

When a user requests a password reset email, check if the email is valid and create a new link.

```ts
app.post("/reset-password", async () => {
	let email: string;

	// ...

	const user = await db.table("user").where("email", "=", email).get();
	if (!user) {
		// If you want to avoid disclosing valid emails,
		// this can be a normal 200 response.
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

Make sure to set the `Referrer-Policy` header of the password reset page to `strict-origin` to protect the token from referrer leakage.

```ts
app.get("/reset-password/:token", async () => {
	// ...
	return new Response(html, {
		headers: {
			"Referrer-Policy": "strict-origin"
		}
	});
});
```

Extract the verification token from the URL and validate by checking the expiration date. If the token is valid, invalidate all existing user sessions, update the database, and create a new session. Make sure to set the `Referrer-Policy` header here as well.

```ts
import { isWithinExpirationDate } from "oslo";
import { hash } from "@node-rs/argon2";
import { sha256 } from "oslo/crypto";
import { encodeHex } from "oslo/encoding";

app.post("/reset-password/:token", async () => {
	let password = formData.get("password");
	if (typeof password !== "string" || password.length < 8) {
		return new Response(null, {
			status: 400
		});
	}
	// check your framework's API
	const verificationToken = params.token;

	// ...

	const tokenHash = encodeHex(await sha256(new TextEncoder().encode(verificationToken)));
	const token = await db.table("password_reset_token").where("token_hash", "=", tokenHash).get();
	if (token) {
		await db.table("password_reset_token").where("token_hash", "=", tokenHash).delete();
	}

	if (!token || !isWithinExpirationDate(token.expires_at)) {
		return new Response(null, {
			status: 400
		});
	}

	await lucia.invalidateUserSessions(token.user_id);
	const passwordHash = await hash(password, {
		// recommended minimum parameters
		memoryCost: 19456,
		timeCost: 2,
		outputLen: 32,
		parallelism: 1
	});
	await db.table("user").where("id", "=", token.user_id).update({
		password_hash: passwordHash
	});

	const session = await lucia.createSession(token.user_id, {});
	const sessionCookie = lucia.createSessionCookie(session.id);
	return new Response(null, {
		status: 302,
		headers: {
			Location: "/",
			"Set-Cookie": sessionCookie.serialize(),
			"Referrer-Policy": "strict-origin"
		}
	});
});
```
