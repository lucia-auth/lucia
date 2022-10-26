---
order: 0
layout: "@layouts/DocumentLayout.astro"
title: "Email verification"
---

There are mainly 2 ways to implement email verification:

1. Send a one-time password (OTP) to the user's email
2. Send a link with a one-time code to the user's email

This guide will use option 1. It's generally considered better practice not to send urls inside emails and to not use GET requests for data modification. Users may receive the email in a different device than the one used for sign up and supporting such cases will increase complexity and may make your app more susceptible.

The general steps are:

1. On sign up, create a new user with the input password
2. Create a new session
3. Generate a random code and save to a database with the user's id
4. Send an email with the code to the user's email
5. Redirect the user to the code-input form
6. Update the user to have a verified email
7. Check for the session and if the user has verified their email on request

The code should be 8 characters long and have an expiration of few hours to a few days. Make sure to use cryptographically random algorithms when generating the code.

## 1. Database

### `user`

Configure the `user` table to store user attributes:

| name           | type      | unique | description                     |
| -------------- | --------- | ------ | ------------------------------- |
| email          | `string`  | true   | User's email                    |
| email_verified | `boolean` |        | If the user's email is verified |

### `user_verification_code`

Create a new table to store user's verification code.

| name    | type     | unique | reference  | description                         |
| ------- | -------- | ------ | ---------- | ----------------------------------- |
| user_id | `string` | true   | `user(id)` | User's id                           |
| code    | `string` |        |            | code                                |
| expires | `number` |        |            | The timestamp when the code expires |

## 2. Set up Lucia

### `app.d.ts`

```ts
// app.d.ts

/// <reference types="lucia-auth" />
declare namespace Lucia {
	type Auth = import("$lib/server/lucia.js").Auth;
	type UserAttributes = {
		email: string;
		email_verified: boolean;
	};
}
```

### Configs

Set up `transformPageData()` to access `email` and `email_verified`.

```ts
lucia({
	transformPageData: (userData) => {
		return {
			userId: userData.id,
			email: userData.email,
			isEmailVerified: userData.email_verified
		};
	}
});
```

## 3. Sign up

Create a new user and set `email_verified` to `false`. Generate a new code, store it with the expiry time, and send it to the user's email

```ts
import { auth } from "$lib/server/lucia";
import { redirect, invalid } from "@sveltejs/kit";
import type { RequestHandler } from "@sveltejs/kit";

export const handleSignUpRequest: RequestHandler = async () => {
	const formData = await request.formData();
	const email = formData.get("email");
	const password = formData.get("password");
	if (!email || !password || typeof email !== "string" || typeof password !== "string")
		return invalid(400);
	try {
		const user = await auth.createUser("email", email, {
			password,
			attributes: {
				email,
				email_verified: false
			}
		});
		const session = await auth.createSession(user.userId);
		const code = generateCode(); // generates number from 00000000 ~ 99999999
		// store new code
		await setUserVerificationCode(userId, {
			code,
			expires: new Date().getTime() + 1000 * 60 * 24 * 8 // 8 hours expiration
		});
		// send email with verification code
		await sendEmailWithCode(email, code);
	} catch {
		return invalid(500);
	}
	throw redirect(302, "/verify-code");
};
```

### Generate random codes

We will use [`nanoid`](https://github.com/ai/nanoid) to generate a random string consisting of numbers.

```ts
import { random, customRandom } from "nanoid";

export const generateCode = (length: number) => {
	const characters = "1234567890"; // possible chars
	return customRandom(characters, 8, random)(); // length: 8
};
```

## 4. Verify code

Get the user's verification code and make sure to check the expiry time. Create a new code and resend it if it's expired. Make sure to invalidate the verification code when it's used.

```ts
import { auth } from "$lib/server/lucia";
import { redirect, invalid } from "@sveltejs/kit";

export const handleCodeVerificationRequest: Action = async ({ request, locals }) => {
	const session = locals.getSession();
	if (!session) return invalid(401);
	const formData = await request.formData();
	const code = await formData.get("code");
	if (!code || typeof code !== "string") return invalid(400);
	try {
		const codeData = await db.getUserVerificationCode(session.userId);
		const currentTime = new Date().getTime();
		// check if code is expired
		if (codeDate.expires > currentTime) {
			await deleteUserVerificationCode(session.userId);
			const newCode = generateCode();
			await setUserVerificationCode(userId, {
				code: newCode,
				expires: new Date().getTime() + 1000 * 60 * 24 * 8 // 8 hours expiration
			});
			await sendEmailWithCode(email, newCode);
			// prompt user to check email again
			return invalid(400, {
				message: "resent code"
			});
		}
		if (codeData.code !== code) return invalid(400);
		await deleteUserVerificationCode(session.userId);
		await auth.updateUserAttributes(session.userId, {
			email_verified: true
		});
	} catch {
		return invalid(500);
	}
	// success - refresh page
	throw redirect(302, "/");
};
```

### Resend code

In the front end, you should have a resend-code button, which will delete the existing code, generate a new one, and send it to the user

```ts
import { auth } from "$lib/server/lucia";
import { redirect, invalid } from "@sveltejs/kit";
import type { RequestHandler } from "@sveltejs/kit";

export const handleResendCodeRequest: RequestHandler = async ({ request, locals }) => {
	const session = locals.getSession();
	if (!session) return invalid(401);
	try {
		await deleteUserVerificationCode(session.userId);
		const code = generateCode();
		await code(userId, {
			code: newCode,
			expires: new Date().getTime() + 1000 * 60 * 24 * 8 // 8 hours expiration
		});
		await sendEmailWithCode(email, code);
	} catch {
		return invalid(500);
	}
	// success
};
```

## 5. Protected pages

Make sure to check if the user has verified their email on requests.

```ts
import { getUser } from "@lucia-auth/sveltekit/load";

export const load: PageLoad = async () => {
	const user = await getUser();
	if (!user) throw redirect(302, "/login");
	if (!user.isEmailVerified) throw redirect(302, "/verify-code"); // to code verification page
};
```
