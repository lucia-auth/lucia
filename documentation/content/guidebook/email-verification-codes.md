---
title: "Email verification codes"
description: "Learn how to verify emails with one-time passwords"
---

An alternative way to verify emails is to use one-time passwords. These are generally more user friendly than verification links and magic links as the login process can be continued on the same device/session. However, **because one-time passwords are susceptible to brute force attack, proper protection must be implemented.**

## Database

### `verification_code`

| name    | type     | unique | references | description                           |
| ------- | -------- | :----: | ---------- | ------------------------------------- |
| id      | any      |   ✓    |            | PRIMARY KEY                           |
| user_id | `string` |   ✓    | `user(id)` | User id                               |
| code    | `string`  |        |            | Verification code                     |
| expires | `bigint` |        |            | `int4` and `timestamp` type works too |

## Generate and send verification code

The verification code should only be only be valid for a short span of time (3~5 minutes). The recommended length is 8 and hashing it is optional in this case.

```ts
import { generateRandomString } from "lucia/utils";

const session = await authRequest.validate();
if (!session) {
	// Unauthorized
	throw new Error();
}
// check if email is already verified
if (session.user.emailVerified) {
	return redirect("/");
}

const code = generateRandomString(8, "0123456789");

await db.transaction((trx) => {
	// delete existing code
	await trx
		.table("verification_code")
		.where("user_id", "=", session.user.userId)
		.delete();
	// create new code
	await trx.table("verification_code").insert({
		code,
		user_id: session.user.userId,
		expires: Date.now() + 1000 * 60 * 5 // 5 minutes
	});
});

await sendVerificationCode(session.user.email, code);
```

## Validate verification codes

Make sure to prevent brute force attacks by limiting the number of attempts. One simple approach is to double the timeout on each failed attempt (2, 4, 8, 16 seconds...). This example tracks attempts in-memory but can of course be handled by a regular database. Remember to check the expiration when validating the code, and invalidate all user sessions before updating user attributes (email verified status).

```ts
const verificationTimeout = new Map<
	string,
	{
		timeoutUntil: number;
		timeoutSeconds: number;
	}
>();
```

```ts
import { isWithinExpiration } from "lucia/utils";

const session = await authRequest.validate();

// prevent brute force by throttling requests
const storedTimeout = verificationTimeout.get(session.user.userId) ?? null;
if (!storedTimeout) {
	// first attempt - setup throttling
	verificationTimeout.set(session.user.userId, {
		timeoutUntil: Date.now(),
		timeoutSeconds: 1
	});
} else {
	// subsequent attempts
	if (!isWithinExpiration(data.timeoutUntil)) {
		throw new Error("Too many requests");
	}
	const timeoutSeconds = storedTimeout.timeoutSeconds * 2;
	verificationTimeout.set(session.user.userId, {
		timeoutUntil: Date.now() + timeoutSeconds * 1000,
		timeoutSeconds
	});
}

const storedVerificationCode = await db.transaction((trx) => {
	const result = await trx
		.table("verification_code")
		.where("user_id", "=", session.user.userId)
		.get();
	if (!result || result.code !== code) {
		throw new Error("Invalid verification code");
	}
	// invalidate code
	await trx.table("verification_code").where("id", "=", result.id).delete();
	return result;
});

if (!isWithinExpiration(storedVerificationCode.expires)) {
	// optionally send a new code instead of an error
	throw new Error("Expired verification code");
}

storedTimeout.delete(session.user.userId);

let user = await auth.getUser(storedVerificationCode.user_id);

await auth.invalidateAllUserSessions(user.userId); // important!

user = await auth.updateUserAttributes(user.userId, {
	email_verified: true // verify email
});

// create session etc
```
