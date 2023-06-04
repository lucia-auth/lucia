---
title: "One-time passwords"
description: "Learn how to set up one-time passwords using links with the tokens integration for Lucia"
---

> (red) Make sure to implement rate-limiting when using one time passwords as it is susceptible to brute-force attacks without it. Use verification links instead if are not planning to add rate limiting.

One time passwords are generally preferred for email verification if implemented properly:

1. The user can continue with their account on any devices
2. Emails are less likely to be identified as spam
3. Promotes good practice of not clicking on links inside emails

### Initialize tokens

One time passwords will use [password tokens](/tokens/basics/password-tokens). Create a new token handler with a name of `otp`, and set tokens to expire in 1 hour. It should be no longer than 24 hours.

```ts
// token.ts
import { auth } from "./lucia.js";
import { passwordToken } from "@lucia-auth/tokens";

export const otpToken = passwordToken(auth, "otp", {
	expiresIn: 60 * 60 // 1 hour
});
```

### Generate and send OTP

Generate a new token using [`issue()`](/reference/tokens/passwordtokenwrapper#issue). Don't forget to use `toString()` to get the stringified value of the token.

```ts
import { otpToken } from "./token.js";

const sendOtp = async () => {
	// ...
	const otp = await otpToken.issue(user.userId);

	// send email with verification link
	sendEmail(email, {
		password: otp.toString()
	});
};
```

### Validate OTP

Using a form, prompt the user to input the password. Validate the password using the user id from the session.

```ts
import { auth } from "./lucia.js";
import { LuciaTokenError } from "@lucia-auth/tokens";
import { otpToken } from "./token.js";

const validateOtp = async () => {
	// ...
	const authRequest = auth.handleRequest();
	const { session } = await authRequest.validateUser();
	try {
		const token = await otpToken.validate(password, session.userId);

		// make sure to invalidate the session
		// if you're updating important user attributes (like passwords)!
		await auth.invalidateAllUserSessions(token.userId);
	} catch (e) {
		if (e instanceof LuciaTokenError && e.message === "EXPIRED_TOKEN") {
			// expired password
			// generate new password and send new email
		}
		if (e instanceof LuciaTokenError && e.message === "INVALID_TOKEN") {
			// invalid username/password
		}
	}
};
```
