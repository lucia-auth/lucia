---
title: "Password tokens"
_order: 0
---

Password tokens are single use passwords linked to a user. Unlike [id tokens](/tokens/basics/id-tokens), a user id is required on token validation.

```ts
import { passwordToken } from "@lucia-auth/tokens";
```

> (warn) We highly recommend implementing a rate-limiter when using one-time passwords to prevent brute-force attacks

## Initialization

`auth` is the initialized Lucia instance, and `tokenName` is the id that all tokens will be generated under. Make sure it's unique and you don't have any other token type with the same name. You can set the generated tokens to expire by defining the duration in seconds, or set it to `null` for it to not expire automatically.

By default the length of the generated token will be 8. You can change this by defining `length`.

```ts
import { idToken } from "@lucia-auth/tokens";
import { auth } from "./lucia.js";

const tokenHandler = idToken(auth, "email-verification", {
	timeout: 60 * 60, // expiration in 1 hour,
	length: 8 // default
});
```

You can also provide your own function to generate tokens. Refer to [`passwordToken()`](/tokens/reference/lucia-auth-tokens#passwordtoken).

## Issue tokens

You can issue a new token by providing [`issue()`](/tokens/reference/passwordtokenwrapper#issue) with the id of the user it'll be linked to.

```ts
import { passwordToken, TokenError } from "@lucia-auth/tokens";

const tokenHandler = passwordToken(auth, "token-name");
try {
	const token = tokenHandler.issue(userId);
	const tokenValue = token.toString();
} catch (e) {
	if (e instanceof TokenError && e.message === "INVALID_USER_ID") {
		// user does not exist
	}
}
```

Since the returned [`Token`](/tokens/reference/token) is an object, use `.toString()` to get a stringified version of it.

## Validate tokens

[`validate()`](/tokens/reference/passwordtokenwrapper) can be used to validate a token. This takes in the stringified version of `Token` (returned by `issue()`) as well as the user id,and returns `Token`.

```ts
import { passwordToken, TokenError } from "@lucia-auth/tokens";

const tokenHandler = passwordToken(auth, "token-name");
try {
	const validatedToken = tokenHandler.validate(token, userId);
} catch (e) {
	if (e instanceof TokenError && e.message === "EXPIRED_TOKEN") {
		// expired token
	}
	if (e instanceof TokenError && e.message === "INVALID_TOKEN") {
		// invalid token
	}
}
```

## Invalidate all tokens of a user

[`invalidateAllUserTokens()`](/tokens/reference/passwordtokenwrapper#invalidateallusertokens) can be used to invalidate all tokens belonging to a user. This will succeed regardless of the validity of the user id.

```ts
import { passwordToken } from "@lucia-auth/tokens";

const tokenHandler = passwordToken(auth, "token-name");
const validatedToken = tokenHandler.invalidateAllUserTokens(userId);
```

## Get tokens

You can list all tokens belonging to the user, both valid and expired, by using [`getAllUserTokens()`](/tokens/reference/passwordtokenwrapper#getallusertokens).

```ts
import { passwordToken, TokenError } from "@lucia-auth/tokens";

const tokenHandler = passwordToken(auth, "token-name");
try {
	const tokens = tokenHandler.getAllUserTokens(userId);
} catch (e) {
	if (e instanceof TokenError && e.message === "INVALID_USER_ID") {
		// user does not exist
	}
}
```

### Check expiration

You can check if the token is expired or not with [`isExpired()`](/tokens/reference/token#isexpired).

```ts
const tokens = tokenHandler.getAllUserTokens(userId);
for (const token of tokens) {
	if (token.isExpired()) {
		// expired
	}
}
```
