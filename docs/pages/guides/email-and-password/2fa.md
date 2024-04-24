---
title: "Two-factor authorization"
---

# Two-factor authorization

The guide covers how to implement two-factor authorization using time-based OTP (TOTP) and authenticator apps.

## Update database

Update the user table to include `two_factor_secret` column. You can of course store the secret in its own table.

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
			// ...
			// don't expose the secret
			// rather expose whether if the user has setup 2fa
			setupTwoFactor: attributes.two_factor_secret !== null
		};
	}
});

declare module "lucia" {
	interface Register {
		Lucia: typeof lucia;
		DatabaseUserAttributes: {
			two_factor_secret: string | null;
		};
	}
}
```

## Create QR code

When the user signs up, set `two_factor_secret` to `null` to indicate the user has yet to set up two-factor authorization.

```ts
app.post("/signup", async () => {
	// ...

	const userId = generateIdFromEntropySize(10);

	await db.table("user").insert({
		id: userId,
		two_factor_secret: null
		// ...
	});

	// ...
});
```

Generate a new secret (minimum 20 bytes) and create a new key URI with [`createTOTPKeyURI()`](https://oslo.js.org/reference/otp/createTOTPKeyURI). The user should scan the QR code using their authenticator app.

```ts
import { encodeHex } from "oslo/encoding";
import { createTOTPKeyURI } from "oslo/otp";

const { user } = await lucia.validateSession(sessionId);
if (!user) {
	return new Response(null, {
		status: 401
	});
}

const twoFactorSecret = crypto.getRandomValues(new Uint8Array(20));
await db
	.table("user")
	.where("id", "=", user.id)
	.update({
		two_factor_secret: encodeHex(twoFactorSecret)
	});

// pass the website's name and the user identifier (e.g. email, username)
const uri = createTOTPKeyURI("my-app", user.email, twoFactorSecret);

// use any image generator
const qrcode = createQRCode(uri);
```

## Validate OTP

Validate TOTP with [`TOTPController`](https://oslo.js.org/reference/otp/TOTPController) using the stored user's secret.

```ts
import { decodeHex } from "oslo/encoding";
import { TOTPController } from "oslo/otp";

let otp: string;

const { user } = await lucia.validateSession(sessionId);
if (!user) {
	return new Response(null, {
		status: 401
	});
}

const result = await db.table("user").where("id", "=", user.id).get("two_factor_secret");
const validOTP = await new TOTPController().verify(otp, decodeHex(result.two_factor_secret));
```
