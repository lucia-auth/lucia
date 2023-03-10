---
title: "Error handling"
_order: 1
---

Lucia [known errors](/learn/basics/error-handling#known-errors) are thrown as [`TokenError`](/tokens/reference/tokenerror) and database errors are thrown as is.

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

Refer to [`TokenError`](/tokens/reference/tokenerror) for a full list of error messages.
