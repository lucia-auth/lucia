---
title: "Email verification codes"
---

# Email verification codes

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
	}
	interface DatabaseUserAttributes {
		email: string;
		email_verified: boolean;
	}
}
```

### Email verification code table

Create a table for storing for email verification codes.

| column       | type     | attributes          |
| ------------ | -------- | ------------------- |
| `id`         | any      | auto increment, etc |
| `code`       | `string` |                     |
| `user_id`    | `string` | unique              |
| `email`      | `string` |                     |
| `expires_at` | `Date`   |                     |

## Generate verification code

The code should be valid for few minutes and linked to a single email.

```ts
import { TimeSpan, createDate } from "oslo";
import { generateRandomString, alphabet } from "oslo/random";

async function generateEmailVerificationCode(userId: string, email: string): Promise<string> {
	await db.table("email_verification_code").where("user_id", "=", userId).deleteAll();
	const code = generateRandomString(8, alphabet("0-9"));
	await db.table("email_verification_code").insert({
		user_id: userId,
		email,
		code,
		expires_at: createDate(new TimeSpan(5, "m")) // 5 minutes
	});
	return code;
}
```

You can also use alphanumeric codes.

```ts
const code = generateRandomString(6, alphabet("0-9", "A-Z"));
```

When a user signs up, set `email_verified` to `false`, create and send a verification code, and create a new session.

```ts
import { generateId } from "lucia";
import { encodeHex } from "oslo/encoding";

app.post("/signup", async () => {
	// ...

	const userId = generateId();

	await db.table("user").insert({
		id: userId,
		email,
		hashed_password: hashedPassword,
		email_verified: false
	});

	const verificationCode = await generateEmailVerificationCode(userId, email);
	await verificationCode(email, verificationCode);

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

## Verify code and email

**Make sure to implement throttling to prevent brute-force attacks**.

Validate the verification code by comparing it against your database and checking the expiration and email. Make sure to invalidate all user sessions.

```ts
import { isWithinExpiration } from "oslo";

app.post("/email-verification", async () => {
	// ...
	const { user } = await lucia.validateSession(sessionId);
	if (!user) {
		return new Response(null, {
			status: 401
		});
	}
	const code = formData.get("code");
	// check for length
	if (typeof code !== "string" || code.length !== 8) {
		return new Response(null, {
			status: 400
		});
	}

	await db.beginTransaction();
	const databaseCode = await db
		.table("email_verification_code")
		.where("user_id", "=", user.id)
		.get();
	if (databaseCode) {
		await db.table("email_verification_code").where("id", "=", databaseCode.id).delete();
	}
	await db.commit();

	if (!databaseCode || databaseCode.code !== code) {
		return new Response(null, {
			status: 400
		});
	}
	if (!isWithinExpiration(databaseCode.expires_at)) {
		return new Response(null, {
			status: 400
		});
	}
	if (!user || user.email !== databaseCode.email) {
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
			"Set-Cookie": sessionCookie.serialize()
		}
	});
});
```
