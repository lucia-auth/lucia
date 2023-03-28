---
title: "Error handling"
_order: 1
description: "Learn about handing errors in the tokens integration for Lucia"
---

Lucia [known errors](/basics/error-handling#known-errors) are thrown as [`LuciaTokenError`](/reference/tokens/luciatokenerror) and database errors are thrown as is.

Using a try-catch block, the error message can be read like so:

```ts
import { TokenError } from "@lucia-auth/tokens";

try {
	// ...
} catch (e) {
	if (e instanceof TokenError) {
		const message = e.message;
	}
}
```

Refer to [`LuciaTokenError`](/reference/tokens/luciatokenerror) for a full list of error messages.
