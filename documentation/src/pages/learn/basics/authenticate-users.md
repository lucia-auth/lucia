---
order: 2
layout: "@layouts/DocumentLayout.astro"
title: "Authenticate users"
---

Users with passwords can be authenticated using [`authenticateUser()`](/reference/api/server-api#authenticateuser). This method will only work if the user has a password (the password is not `null`). The provider name and an identifier declared during creation is necessary, both of which are explained in [Create users](/learn/basics/create-users). An error will be thrown if the password is incorrect.

While Lucia will tell you (via an error) if the provider id or the password was incorrect, **never expose such data to the client**. Make the error message vague as possible (eg. "Invalid credentials").

This method will not create a new session (tokens). To create a new session after authenticating a user, refer to [Create sessions](/learn/basics/create-sessions).

```ts
import { auth } from "./lucia.js";

await auth.authenticateUser(providerName, identifier, password);
```

## Example

The following example uses `email` as the provider name and the provided email as the identifier.

```ts
import { auth } from "./lucia.js";

const authenticateUser = async (email: string, password: string) => {
	try {
		await auth.authenticateUser("email", email, password);
	} catch {
		// error (invalid provider id or password, etc)
	}
};
```
