---
title: "Password reset"
description: "Learn how to set up password reset with the tokens integration for Lucia"
---

Password reset will be handled using verification links.

The repository includes example projects for some frameworks:

- [SvelteKit](https://github.com/pilcrowOnPaper/lucia/tree/main/examples/sveltekit-email)
- [Astro](https://github.com/pilcrowOnPaper/lucia/tree/main/examples/astro-email)

### 1. Initialize tokens

The tokens for verification links will use [id tokens](/tokens/basics/id-tokens). Create a new token handler with a name of `password-reset`, and set tokens to expire in 1 hour.

```ts
// $lib/lucia.ts

import { auth } from "./lucia.js";
import { idToken } from "@lucia-auth/tokens";

export const auth = lucia({
	// ...
});

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

Generate a new token using [`issue()`](/reference/tokens/idtokenwrapper#issue). Don't forget to use `toString()` to get the stringified value of the token.

You can optionally add an check if the email exists in the database.

```ts
// src/routes/password-reset/+page.server.ts
// page to enter email
import { auth } from "lucia.js";

export const handleSendPasswordResetLinkRequest = async () => {
	// ...
	try {
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
		const token = await passwordResetToken.issue(user.userId);
		await sendPasswordResetEmail(user.email, token.toString());
	} catch {
		// ...
	}
};
```

### 3. Handle verify requests

When the user opens the link, prompt the user to enter their new password.

On form/POST request, get the token stored inside the url parameter and validate it using [`validate()`](/reference/tokens/idtokenwrapper#validate). If valid, update the password, invalidate all user sessions and tokens, create a new session, and send it to the validated client. Make sure to properly handle errors, like when the tokens are expired.

If you have implemented email verification, you can verify the user's email as well.

```ts
// src/routes/password-reset/[token]/+page.server.ts
// page to enter new password
import { LuciaTokenError } from "@lucia-auth/tokens";
import { auth, passwordResetToken } from "$lib/lucia";

const handlePasswordResetRequest = async () => {
	// ...
	const authRequest = auth.handleRequest();
	try {
		const token = await passwordResetToken.validate(params.token ?? "");
		const user = await auth.getUser(token.userId);
		await auth.invalidateAllUserSessions(user.userId);
		// update key
		await auth.updateKeyPassword("email", user.email, password);
		const session = await auth.createSession(user.userId);
		authRequest.setSession(session);
	} catch (e) {
		if (e instanceof LuciaTokenError && e.message === "EXPIRED_TOKEN") {
			// expired token/link
		}
		if (e instanceof LuciaTokenError && e.message === "INVALID_TOKEN") {
			// invalid link
		}
	}
};
```

> (warn) Make sure to invalidate all password-reset tokens and sessions on password reset!!
