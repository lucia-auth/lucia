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

Generate a new token using [`issue()`](/reference/tokens/idtokenwrapper#issue) and store it inside `token` parameter of the verification api url. Don't forget to use `toString()` to get the stringified value of the token.

```ts
import { passwordResetToken } from "./token.js";

const token = await passwordResetToken.issue(user.userId);
const url = new URL("https://example.com/reset-password"); // api to reset password
url.searchParams.set("token", token.toString());

// send email with verification link
sendEmail(email, {
	link: url
});
```

### 3. Handle verify requests

When the user opens the link, prompt the user to enter their new password.

On form/POST request, get the token stored inside the url parameter and validate it using [`validate()`](/reference/tokens/idtokenwrapper#validate). If valid, update the password, invalidate all user sessions and tokens, create a new session, and send it to the validated client. Make sure to properly handle errors, like when the tokens are expired.

```ts
// POST /reset-password

import { auth } from "./lucia.js";
import { LuciaTokenError } from "@lucia-auth/tokens";
import { passwordResetToken } from "./token.js";

const newPassword = formData.get("password"); // get input
const tokenParams = url.searchParams.get("token");
try {
	const token = await passwordResetToken.validate(tokenParams);
	await passwordResetToken.invalidateAllUserTokens(token.userId);
	// check length etc
	if (!isValidPassword(newPassword)) {
		// prompt user to use a more secure password
	}
	// update password
	await auth.updateKeyPassword(providerId, providerUserId, newPassword);
	await auth.invalidateAllUserSessions(token.userId);
	const session = await auth.createSession(token.userId);
	// store new session
	// redirect user
} catch (e) {
	if (e instanceof LuciaTokenError && e.message === "EXPIRED_TOKEN") {
		// expired token/link
		// generate new token and send new link
	}
	if (e instanceof LuciaTokenError && e.message === "INVALID_TOKEN") {
		// invalid link
	}
}
```

> (warn) Make sure to invalidate all password-reset tokens and sessions on password reset!!
