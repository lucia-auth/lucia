---
title: "Id tokens"
_order: 0
description: "Learn about ID tokens in the tokens integration for Lucia"
---

Id tokens are regular tokens linked to the user to identify the token holder, such as for magic links.
These tokens can be validated individually and only the token itself is required for validation.

```ts
import { idToken } from "@lucia-auth/tokens";
```

## Initialization

`auth` is the initialized Lucia instance, and `tokenName` is the id that all tokens will be generated under. Make sure it's unique and you don't have any other token type with the same name. Duration until expiration in seconds must be defined.

By default the length of the generated token will be 43. You can change this by defining `length`.

```ts
import { idToken } from "@lucia-auth/tokens";
import { auth } from "./lucia.js";

const tokenHandler = idToken(auth, "email-verification", {
	expiresIn: 60 * 60, // expiration in 1 hour,
	length: 43 // default
});
```

You can also provide your own function to generate tokens. Refer to [`idToken()`](/reference/tokens/lucia-auth-tokens#idtoken).

## Issue tokens

You can issue a new token by providing [`issue()`](/reference/tokens/idtokenwrapper#issue) with the id of the user it'll be linked to.

```ts
import { idToken, LuciaTokenError } from "@lucia-auth/tokens";

const tokenHandler = idToken(auth, "token-name");
try {
	const token = tokenHandler.issue(userId);
	const tokenValue = token.toString();
} catch (e) {
	if (e instanceof LuciaTokenError && e.message === "INVALID_USER_ID") {
		// user does not exist
	}
}
```

Since the returned [`Token`](/reference/tokens/token) is an object, use `.toString()` to get a stringified version of it.

## Validate tokens

[`validate()`](/reference/tokens/idtokenwrapper#validate) can be used to validate a token. This takes in the stringified version of `Token` (returned by `issue()`) and returns `Token`.

```ts
import { idToken, LuciaTokenError } from "@lucia-auth/tokens";

const tokenHandler = idToken(auth, "token-name");
try {
	const validatedToken = tokenHandler.validate(tokenValue);
} catch (e) {
	if (e instanceof LuciaTokenError && e.message === "EXPIRED_TOKEN") {
		// expired token
	}
	if (e instanceof LuciaTokenError && e.message === "INVALID_TOKEN") {
		// invalid token
	}
}
```

## Invalidate tokens

[`invalidate()`](/reference/tokens/idtokenwrapper#invalidate) can be used to invalidate a specific token. This will succeed regardless of the validity of the token.

```ts
import { idToken } from "@lucia-auth/tokens";

const tokenHandler = idToken(auth, "token-name");
const validatedToken = tokenHandler.invalidateToken(token);
```

### Invalidate all tokens of a user

[`invalidateAllUserTokens()`](/reference/tokens/idtokenwrapper#invalidateallusertokens) can be used to invalidate all tokens belonging to a user. This will succeed regardless of the validity of the user id.

```ts
import { idToken } from "@lucia-auth/tokens";

const tokenHandler = idToken(auth, "token-name");
const validatedToken = tokenHandler.invalidateAllUserTokens(userId);
```

## Get tokens

You can list all tokens belonging to the user, both valid and expired, by using [`getAllUserTokens()`](/reference/tokens/idtokenwrapper#getallusertokens).

```ts
import { idToken, LuciaTokenError } from "@lucia-auth/tokens";

const tokenHandler = idToken(auth, "token-name");
try {
	const tokens = tokenHandler.getAllUserTokens(userId);
} catch (e) {
	if (e instanceof LuciaTokenError && e.message === "INVALID_USER_ID") {
		// user does not exist
	}
}
```

### Check expiration

You can check if the token is expired or not with [`expired`](/reference/tokens/token#expired).

```ts
const tokens = tokenHandler.getAllUserTokens(userId);
for (const token of tokens) {
	if (token.expired) {
		// expired
	}
}
```
