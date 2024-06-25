---
title: "Email verification links"
---

# Email verification links

Email verification works by storing a secret token inside a link. The user's email address is verified when they visit the link.

```
https://example.com/email-verification/<TOKEN>
```

We recommend using [email verification codes](/guides/email-and-password/email-verification-codes) instead as it's more user-friendly. We also recommend reading through the [email verification guide](https://thecopenhagenbook.com/email-verification) in the Copenhagen Book.

## Update database

### User table

Add a `email_verified` column (boolean).

```ts
import { Lucia } from "lucia";

export const lucia = new Lucia(adapter, {
	sessionCookie: {
		attributes: {
			secure: env === "PRODUCTION" // set `Secure` flag in HTTPS
		}
	},
	getUserAttributes: (attributes) => {
		return {
			emailVerified: attributes.email_verified,
			email: attributes.email
		};
	}
});

declare module "lucia" {
	interface Register {
		Lucia: typeof lucia;
		DatabaseUserAttributes: {
			email: string;
			email_verified: boolean;
		};
	}
}
```

### Email verification token table

Create a table for storing for email verification tokens.

| column       | type     | attributes  |
| ------------ | -------- | ----------- |
| `id`         | `string` | primary key |
| `user_id`    | any      |             |
| `email`      | `string` |             |
| `expires_at` | `Date`   |             |

## Create verification token

The token should be valid for at most few hours and linked to a single email.

```ts
import { TimeSpan, createDate } from "oslo";

async function createEmailVerificationToken(userId: string, email: string): Promise<string> {
	// optionally invalidate all existing tokens
	await db.table("email_verification_token").where("user_id", "=", userId).deleteAll();
	const tokenId = generateIdFromEntropySize(25); // 40 characters long
	await db.table("email_verification_token").insert({
		id: tokenId,
		user_id: userId,
		email,
		expires_at: createDate(new TimeSpan(2, "h"))
	});
	return tokenId;
}
```

When a user signs up, set `email_verified` to `false`, create and send a verification token, and create a new session. You can either store the token as part of the pathname or inside the search params of the verification endpoint.

```ts
import { generateIdFromEntropySize } from "lucia";

app.post("/signup", async () => {
	// ...

	const userId = generateIdFromEntropySize(10); // 16 characters long

	await db.table("user").insert({
		id: userId,
		email,
		password_hash: passwordHash,
		email_verified: false
	});

	const verificationToken = await createEmailVerificationToken(userId, email);
	const verificationLink = "http://localhost:3000/email-verification/" + verificationToken;
	await sendVerificationEmail(email, verificationLink);

	const session = await lucia.createSession(userId, {});
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

When resending verification emails, make sure to implement rate limiting based on user ID and IP address.

## Verify token and email

Extract the email verification token from the URL and validate by checking the expiration date and email. If the token is valid, invalidate all existing user sessions and create a new session. Make sure to invalidate all user sessions.

```ts
import { isWithinExpirationDate } from "oslo";

app.get("email-verification/:token", async () => {
	// ...

	// check your framework's API
	const verificationToken = params.token;

	await db.beginTransaction();
	const token = await db
		.table("email_verification_token")
		.where("id", "=", verificationToken)
		.get();
	if (token) {
		await db.table("email_verification_token").where("id", "=", token.id).delete();
	}
	await db.commit();

	if (!token || !isWithinExpirationDate(token.expires_at)) {
		return new Response(null, {
			status: 400
		});
	}
	const user = await db.table("user").where("id", "=", token.user_id).get();
	if (!user || user.email !== token.email) {
		return new Response(null, {
			status: 400
		});
	}

	await lucia.invalidateUserSessions(user.id);
	await db.table("user").where("id", "=", user.id).update({
		email_verified: true
	});

	const session = await lucia.createSession(user.id, {});
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
