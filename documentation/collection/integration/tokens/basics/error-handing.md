---
title: "Error handling"
_order: 1
---

Lucia [known errors](/learn/basics/error-handling#known-errors) are thrown as [`LuciaTokenError`](/tokens/reference/luciatokenerror) and database errors are thrown as is.

Using a try-catch block, the error message can be read like so:

```ts
import { LuciaTokenError } from "@lucia-auth/tokens";

try {
	// ...
} catch (e) {
	if (e instanceof LuciaTokenError) {
		const message = e.message;
	}
}
```

Refer to [`LuciaTokenError`](/tokens/reference/luciatokenerror) for a full list of error messages.
