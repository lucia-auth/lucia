---
title: "Email verification"
description: "Learn how to set up email verification with the tokens integration for Lucia"
---

The basic steps of email verification is as follow:

1. Create a new user with Lucia with email-verified attribute set to `false`
2. Block any access to resources from the user
3. Validate the user's email
4. Update email-verified attribute to `true`

Since the user will be able to create a user with any emails (though they won't be do anything meaningful), it's important to implement password resets in conjunction. This makes sure the real owner of the email will be able to create an account even if someone else attempted to use it.

Both of methods introduced here can be modified to be used for 2FA.

## Setup

### 1. Set up database

Add a `email_verified` column to store whether the user's email has been verified or not.

```ts
export const auth = lucia({
	// ...
	transformDatabaseUser: (userData) => {
		return {
			userId: userData.id,
			isEmailVerified: userData.email_verified
		};
	}
});
```

### 2. Create user on sign up

Create a new user with a primary key. Set `email_verified` to `false`.

```ts
import { auth } from "./lucia.js";

const user = await auth.createUser({
	primaryKey: {
		providerId: "email",
		providerUserId: email,
		password
	},
	attributes: {
		email_verified: false
	}
});
```

### 3. Protect pages

Make sure all protected page checks whether your user has a verified email.

```ts
// protected page

const user = await getUserFromRequest(); // getUserFromRequest() is just an example
if (!user.attributes.isEmailVerified) {
	// email not verified
}
```

## One time passwords

> (red) Make sure to implement rate-limiting when using one time passwords as it is susceptible to brute-force attacks without it. Use verification links instead if are not planning to add rate limiting.

One time passwords are generally preferred for email verification:

1. The user can continue with their account on any devices
2. Emails are less likely to be identified as spam
3. Promotes good practice of not clicking on links inside emails

### 1. Initialize tokens

One time passwords will use [password tokens](/tokens/basics/password-tokens). Create a new token handler with a name of `otp`, and set tokens to expire in 1 hour. It should be no longer than 24 hours.

```ts
// token.ts

import { auth } from "./lucia.js";
import { passwordToken } from "@lucia-auth/tokens";

export const otpToken = passwordToken(auth, "otp", {
	expiresIn: 60 * 60 // 1 hour
});
```

### 2. Generate and send OTP

Generate a new token using [`issue()`](/reference/tokens/passwordtokenwrapper#issue). Don't forget to use `toString()` to get the stringified value of the token.

```ts
import { otpToken } from "./token.js";

const otp = await otpToken.issue(user.userId);

// send email with verification link
sendEmail(email, {
	password: otp.toString()
});
```

### 3. Validate OTP

Using a form, prompt the user to input the password. Validate the password using the user id from the session.

```ts
// POST /

import { auth } from "./lucia.js";
import { LuciaTokenError } from "@lucia-auth/tokens";
import { otpToken } from "./token.js";

const session = await getSessionFromRequest(); // getSessionFromRequest() is just an example
const password = formData.get("password"); // password from form
try {
	const token = await otpToken.validate(password, session.userId);
	await auth.updateUserAttributes(token.userId, {
		email_verified: true
	});
	await auth.invalidateAllUserSessions(token.userId);
	const newSession = await auth.createSession(token.userId);
	// store new session
	// redirect user
} catch (e) {
	if (e instanceof LuciaTokenError && e.message === "EXPIRED_TOKEN") {
		// expired password
		// generate new password and send new email
	}
	if (e instanceof LuciaTokenError && e.message === "INVALID_TOKEN") {
		// invalid password
	}
}
```

## Verification links

### 1. Initialize tokens

The tokens for verification links will use [id tokens](/tokens/basics/id-tokens). Create a new token handler with a name of `email-verification`, and set tokens to expire in 1 hour. It should be no longer than 24 hours.

```ts
// token.ts

import { auth } from "./lucia.js";
import { idToken } from "@lucia-auth/tokens";

export const emailVerificationToken = idToken(auth, "email-verification", {
	expiresIn: 60 * 60 // 1 hour
});
```

### 2. Generate and send verification link

Generate a new token using [`issue()`](/reference/tokens/idtokenwrapper#issue) and store it inside `token` parameter of the verification api url. Don't forget to use `toString()` to get the stringified value of the token.

```ts
import { emailVerificationToken } from "./token.js";

const token = await emailVerificationToken.issue(user.userId);
const url = new URL("https://example.com/verify-email"); // api to verify tokens
url.searchParams.set("token", token.toString());

// send email with verification link
sendEmail(email, {
	link: url
});
```

### 3. Handle verify requests

Get the token stored inside the url parameter and validate it using [`validate()`](/reference/tokens/idtokenwrapper#validate). If valid, invalidate all user sessions, create a new session, and send it to the validated client. Make sure to properly handle errors, like when the tokens are expired.

```ts
// GET /verify-email

import { auth } from "./lucia.js";
import { LuciaTokenError } from "@lucia-auth/tokens";
import { emailVerificationToken } from "./token.js";

const tokenParams = url.searchParams.get("token");
try {
	const token = await emailVerificationToken.validate(tokenParams);
	await auth.updateUserAttributes(token.userId, {
		email_verified: true
	});
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
