---
order: 0
layout: "@layouts/DocumentLayout.astro"
title: "Create users"
---

It's important to start off by noting that users and sessions, while connected, are different things. Creating a user does not automatically create a new session, and deleting a session does not delete a user.

The combination of these is called provider id. The `createUser` method can be used to create users, which requires a provider name and identifier. Lucia (or rather the database) will automatically generate a user id for your users on creation.

```ts
import { auth } from "$lib/server/lucia.ts";

await auth.createUser(providerName, identifier, options);
```

### Provider ids

Users can be identified using either of 2 attributes: user id and provider id. You can think of user id as for referencing users internally, and provider id for referencing users using external data. This means you can use the user's input or data from OAuth provider to validate and get a user.

Provider id is the combination of the provider name (the authentication method used), and an identifier (something unique to that user within the authentication method). For example, for email/password, `email` can be the provider name and the user's email can be the identifier; and for Github OAuth, `github` can be the provider name and the user's Github user id can be the identifier.

## Create a user

### Without a password

This is useful when you can trust the input for the provider name and identifier. When implementing OAuth for example, you can trust that the provider has validated the user and has given you the correct identifier (you will never get the information about user B when user A signs in with the OAuth provider).

```ts
import { auth } from "$lib/server/lucia";

await auth.createUser("github", "user@example.com");
```

### With a password

This is useful for the simple email/username and password approach. The password will be automatically hashed when storing the user's data.

```ts
import { auth } from "$lib/server/lucia";

await auth.createUser("email", "user@example.com", {
    password: "123456",
});
```

## Store additional user data

By default, Lucia will store the user id, provider id, and the hashed password (if a password is provided). The components of the provider id - the provider name and identifier - are not stored in its own column, and is combined so as to be stored in a single column. Storing additional data of the users is not automatically supported and some minimal work is needed to configure your database. Lucia will throw an error if the provided user data violdates a unique constraint of a column. Refer to [Store additional user data](/learn/basics/store-additional-user-data) for more information.

```ts
import { auth } from "$lib/server/lucia";

await auth.createUser("github", "user@example.com", {
    userData: {
        username: "user",
        phoneNumber: "000-0000-0000",
    },
});
```

## Example

The following example uses `email` as the provider name and the provided email as the identifier.

```ts
// inside a server
import { auth } from "$lib/server/lucia";

const createUser = async (email: string, password: string) => {
    const user = await auth.createUser("email", email, {
        password,
    });
};
```
