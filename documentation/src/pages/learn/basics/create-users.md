---
order: 0
layout: "@layouts/DocumentLayout.astro"
title: "Create users"
---

The [`createUser()`](/reference/api/server-api#createuser) method can be used to create users, which requires a provider name and identifier. Lucia (or rather the database) will automatically generate a user id for your users on creation. However, you can generate your own user id using [`configurations.generateCustomUserId`](/reference/configure/lucia-configurations#generatecustomuserid).

This method will not create a new session (tokens). To create a new session after creating a user, refer to [Create sessions](/learn/basics/authenticate-users).

```ts
import { auth } from "$lib/server/lucia.ts";

await auth.createUser(providerName, identifier, options);
```

## Create a user

### Without a password

This is useful when you can trust the input for the provider name and identifier. When implementing OAuth for example, you can trust that the provider has validated the user and has given you the correct identifier (you will never get the information about user B when user A signs in with the OAuth provider).

```ts
import { auth } from "$lib/server/lucia";

try {
    await auth.createUser("github", "user@example.com");
} catch {
    // invalid input
}
```

### With a password

This is useful for the simple email/username and password approach. The password will be automatically hashed when storing the user's data.

```ts
import { auth } from "$lib/server/lucia";

try {
    await auth.createUser("email", "user@example.com", {
        password: "123456",
    });
} catch {
    // invalid input
}
```

## Store additional user data

By default, Lucia will store the user id, provider id, and the hashed password (if a password is provided). The components of the provider id - the provider name and identifier - are not stored in its own column, and is combined so as to be stored in a single column. Storing additional data of the users is not automatically supported and some minimal work is needed to configure your database. Lucia will throw an error if the provided user data violates a unique constraint of a column. Refer to [Store additional user data](/learn/basics/store-additional-user-data) for more information.

```ts
import { auth } from "$lib/server/lucia";

try {
    await auth.createUser("github", "user@example.com", {
        attributes: {
            username: "user",
            phone_number: "000-0000-0000",
        },
    });
} catch {
    // invalid input
}
```

## Example

The following example uses `email` as the provider name and the provided email as the identifier.

```ts
// inside a server
import { auth } from "$lib/server/lucia";

const createUser = async (email: string, password: string) => {
    try {
        const user = await auth.createUser("email", email, {
            password,
        });
    } catch {
        // error (user already exists, etc)
    }
};
```
