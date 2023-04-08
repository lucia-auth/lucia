---
title: "Password reset"
description: "Learn how to set up password reset with the tokens integration for Lucia"
---

Password reset will be handled using verification links.

### 1. Initialize tokens

The tokens for verification links will use [id tokens](/tokens/basics/id-tokens). Create a new token handler with a name of `password-reset`, and set tokens to expire in 1 hour. It should be no longer than 24 hours.

```ts
// token.ts

import { auth } from "./lucia.js";
import { idToken, LuciaTokenError } from "@lucia-auth/tokens";

export const passwordResetToken = idToken(auth, "password-reset", {
	expiresIn: 60 * 60 // 1 hour
});
```

### 2. Generate and send verification link

The verification link should like something this:

```
https://localhost:3000/password-reset/[token]
```

You can alternatively store the token in a query params.

Generate a new token using [`issue()`](/reference/tokens/idtokenwrapper#issue) and store it inside `token` parameter of the verification api url. Don't forget to use `toString()` to get the stringified value of the token.

You can optionally add an check if the email exists in the database.

```ts
import { passwordResetToken } from "./token.js";

const databaseUser = await db.authUser.findFirst({
	where: {
		email: email
	}
});
if (!databaseUser) {
	return fail(400, {
		message: "Email does not exist",
		email
	});
}
const user = auth.transformDatabaseUser(databaseUser);
try {
	const token = await passwordResetToken.issue(user.userId);

	// send email with verification link
	sendVerificationEmail(email, token.toString());
} catch {
	// ...
}
```

### 3. Handle verify requests

When the user opens the link, prompt the user to enter their new password.

On form/POST request, get the token and validate it using [`validate()`](/reference/tokens/idtokenwrapper#validate). If valid, update the password, invalidate all user sessions and tokens, create a new session, and send it to the validated client. Make sure to properly handle errors, like when the tokens are expired.

If you have implemented email verification, you can verify the user's email as well.

```ts
// POST /password-reset

import { auth } from "./lucia.js";
import { LuciaTokenError } from "@lucia-auth/tokens";
import { passwordResetToken } from "./token.js";

try {
	// extract and validate token from url
	const token = await passwordResetToken.validate(params.token ?? "");
	const user = await auth.getUser(token.userId);
	await auth.updateKeyPassword(providerId, providerUserId, newPassword);
	await auth.invalidateAllUserSessions(token.userId);
	const session = await auth.createSession(token.userId);
	// store new session
	// redirect user
} catch (e) {
	if (e instanceof LuciaTokenError && e.message === "EXPIRED_TOKEN") {
		// expired token/link
	}
	if (e instanceof LuciaTokenError && e.message === "INVALID_TOKEN") {
		// invalid link
	}
}
```

> (warn) Make sure to invalidate all password-reset tokens and sessions on password reset!!
