---
order: 1
layout: "@layouts/DocumentLayout.astro"
title: "Store user attributes"
---

Any number of additional columns can be added to the `user` table. This should be generally used for commonly used data (like username and profile pictures) and for user permissions (like if the user is an admin). Larger and specific data should be stored inside a different table.

The column can be unique as well, and Lucia will throw an error when a provided user data violates the unique rule upon user creation or update.

## Get user attributes

By default, the `User` object only includes the user id:

```ts
type User = {
	userId: string;
};
```

We can customize this object by providing a `transformUserData()` function to the configs.

```ts
export const auth = lucia({
	transformUserData: (userData) => {
		return {
			userId: userData.id
		};
	}
});
```

`userData` holds `id` (the user id) and the key/value pair of any columns you have added to the `user` table.

## Types

To type `User`, add the column names and the value type inside `Lucia.UserAttributes` in `src/app.d.ts`:

```ts
/// <reference types="lucia-sveltekit" />
declare namespace Lucia {
	interface UserAttributes {}
}
```

Refer to [Type declaration](/reference/types/lucia-namespace).

## Example

To store user's username, for example, a `username` column should be added to the `user` table:

| column          | type   |
| --------------- | ------ |
| id              | string |
| hashed_password | string |
| provider_id     | string |
| username        | string |

This should be typed in `Lucia.UserAttributes`:

```ts
/// <reference types="lucia-sveltekit" />
declare namespace Lucia {
	interface UserData {
		username: string;
	}
}
```

This username column can be accessed with `userData.username` inside `transformUserData()` in configs:

```ts
export const auth = lucia({
	transformUserData: (userData) => {
		return {
			userId: userData.id,
			username: userData.username
		};
	}
});
```

This allows us to access `username` inside the `User` object:

```ts
import { auth } from "$lib/server/lucia.ts";

const user = await auth.getUser();
const username = user.username;
```
