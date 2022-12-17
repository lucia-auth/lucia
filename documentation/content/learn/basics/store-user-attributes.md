---
order: 1
title: "Store user attributes"
---

In addition to the required columns, any number of columns can be added to the `user` table. This should be generally used for storing commonly used data (like username and profile pictures) or user-permissions (like if the user is an admin). Larger and specific data should be stored inside a different table to save on bandwidth.

Lucia will re-throw the error from the database on user creation/update if the provided data violates constraints/rules.

## Populate `User` object

By default, the `User` object (returned by methods like [`getUser()`](/reference/api/server-api#getuser)) only includes the user id:

```ts
type User = {
	userId: string;
};
```

You can customize this object by providing a [`transformUserData()`](/reference/configure/lucia-configurations#transformuserdata) function in the configs. Lucia will automatically use the return type as the type of the `User` object.

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

### Types

To type `userData` for `transformUserData()`, add the column names and the value type inside `Lucia.UserAttributes`:

```ts
// app.d.ts
/// <reference types="lucia-auth" />
declare namespace Lucia {
	// ...
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
// app.d.ts
/// <reference types="lucia-auth" />
declare namespace Lucia {
	// ...
	interface UserAttributes {
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
import { auth } from "./lucia.js";

const user = await auth.getUser();
const username = user.username;
```
