---
title: "Email verification links"
description: "Learn how to set up email verification links with the tokens integration for Lucia"
---

Email verification links allow you to verify the email the user has provided. You can alternatively use [one-time passwords](/tokens/guides/one-time-passwords).

```
/signup - sign up page
/email-verification - form for resending emails
/email-verification/[token] - verification link
```

The basic steps are as follows:

1. On user creation, set `email_verified` attribute to `false`
2. Generate token
3. Send link with token to the user's email
4. Block access to resources if `email_verified` is false
5. Set `email_verified` to `true` when the link is clicked

> (warn) **Make sure to implement a way to reset passwords.**

The repository includes example projects for some frameworks:

- [SvelteKit](https://github.com/pilcrowOnPaper/lucia/tree/main/examples/sveltekit-email)
- [Astro](https://github.com/pilcrowOnPaper/lucia/tree/main/examples/astro-email)

## Set up

Make sure the tokens integration is installed:

```
npm i @lucia-auth/tokens
pnpm add @lucia-auth/tokens
yarn add @lucia-auth/tokens
```

### Database schema

Add a `email_verified` (boolean) and `email` (string, unique) to the user schema.

```ts
// src/lib/lucia.ts
export const auth = lucia({
	// ...
	transformDatabaseUser: (databaseUser) => {
		return {
			userId: databaseUser.id,
			email: databaseUser.email,
			emailVerified: databaseUser.email_verified
		};
	}
});
```

```ts
// src/app.d.ts
/// <reference types="lucia-auth" />
declare global {
	namespace Lucia {
		type Auth = import("$lib/lucia").Auth;
		type UserAttributes = {
			email: string;
			email_verified: boolean;
		};
	}
}
```

### Initialize tokens

Initialize a new [id token](/tokens/basics/id-tokens) with a name of `email_verification`. You cannot change this name once a token has been generated so be careful!

```ts
// lucia.ts
import { idToken } from "@lucia-auth/tokens";

export const auth = lucia({
	// ...
});

export type Auth = typeof auth;

export const emailVerificationToken = idToken(auth, "email_verification", {
	expiresIn: 60 * 60 // 1 hour
});
```

## Account creation

### Create user

When a user creates an account, store the `email` and set `email_verified` to `false`:

```ts
// /signup
import { auth } from "$lib/lucia";

const handleSignUp = async () => {
	const authRequest = auth.handleRequest();
	try {
		// ...
		const user = await auth.createUser({
			primaryKey: {
				providerId: "email",
				providerUserId: email,
				password
			},
			attributes: {
				email,
				email_verified: false
			}
		});
		const session = await auth.createSession(user.userId);
		authRequest.setSession(session);
	} catch (e) {
		// ...
	}
};
```

`AUTH_DUPLICATE_KEY_ID` will be thrown if the email is already taken. However, since the `user(email)` is unique as well, the database may throw a duplicate error for that column/field, in which case Lucia will not catch the error.

> On validating emails: Emails are super complex and it isn't practical to validate them using Regex. Just make sure it includes `@`, at least character on either side of `@`, and maybe a `.` inside the string after `@`.

### Issue a new token

Issue a new token with [`issue()`](/reference/tokens/idtokenwrapper#issue).

```ts
// src/routes/signup/+page.server.ts
import { auth, emailVerificationToken } from "$lib/lucia";

const handleSignUpRequest = async () => {
	const authRequest = auth.handleRequest();
	try {
		// ...
		const user = await auth.createUser({
			// ...
		});
		// ...

		const token = await emailVerificationToken.issue(user.userId);
		// send verification link - see next section
		await sendEmailVerificationEmail(user.email, token.toString());
	} catch (e) {
		// ...
	}
};
```

## Verification links

Your verification links should look something like this:

```
https://example.com/email-verification/[token]
```

### Verify token

Validate the token using [`validate()`](/reference/tokens/idtokenwrapper#validate). Update the `email_verified` attribute to `true`. **Make sure to invalidate all sessions belonging to the user**.

```ts
// src/routes/email-verification/[token]
import { auth, emailVerificationToken } from "$lib/lucia";
import { LuciaTokenError } from "@lucia-auth/tokens";

const handleEmailVerificationRequest = async () => {
	const authRequest = auth.handleRequest();
	const tokenParams = params.token; // get [token]
	try {
		const token = await emailVerificationToken.validate(tokenParams);
		await auth.invalidateAllUserSessions(token.userId);
		await auth.updateUserAttributes(token.userId, {
			email_verified: true
		});
		const session = await auth.createSession(token.userId);
		authRequest.setSession(session);
		// success
	} catch {
		if (e instanceof LuciaTokenError && e.message === "EXPIRED_TOKEN") {
			// expired token/link
		}
		if (e instanceof LuciaTokenError && e.message === "INVALID_TOKEN") {
			// invalid link
		}
	}
};
```

### Resend verification link

Make sure to check if the user's email is verified already before sending a new token:

```ts
// src/routes/email-verification

const handleResendEmailRequest = async () => {
	const authRequest = auth.handleRequest();
	const { user } = await authRequest.validateUser();
	if (!user || user.emailVerified) {
		//
		return fail(401);
	}
	try {
		const token = await emailVerificationToken.issue(user.userId);
		await sendEmailVerificationEmail(user.email, token.toString());
	} catch {
		// ...
	}
};
```

## Protect routes

```ts
const authRequest = auth.handleRequest();
const { user } = await authRequest.validateUser();
if (!user) {
	// not authenticated
}
if (user && !user.emailVerified) {
	// requires email verification
}
```
