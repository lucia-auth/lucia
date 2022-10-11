---
order: 2
layout: "@layouts/DocumentLayout.astro"
title: "Authenticate users"
---

Users with passwords can be authenticated using `authenticateUser()`. This method will only work if the user has a password. The provider name and an identifier declared during creation is necessary, both of which are explained in [Create users](/learn/basics/create-users). An error will be thrown if the password is incorrect.

```ts
import { auth } from "$lib/server/lucia.ts";

await auth.authenticateUser(providerName, identifier, password);
```

## Example

The following example uses `email` as the provider name and the provided email as the identifier.

```ts
import { auth } from "$lib/server/lucia.ts";

const authenticateUser = async (email: string, password: string) => {
    try {
        await auth.authenticateUser("email", email, password);
    } catch {
        // error (invalid provider id or password, etc)
    }
};
```
