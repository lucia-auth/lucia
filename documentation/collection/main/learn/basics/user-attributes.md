---
_order: 3
title: "User attributes"
---

In addition to the required user id, you can add any columns/fields to the user table to store user attributes. This should be generally used for storing commonly used data (like username and profile pictures) or user-permissions (like if the user is an admin). Larger and specific data should be stored inside a different table.

Lucia will re-throw the error from the database on user creation/update if the provided data violates constraints/rules.

## Populate `User` object

By default, the `User` object (returned by methods like [`getUser()`](/reference/api/server-api#getuser)) only includes the user id:

```ts
type User = {
	userId: string;
};
```

You can customize this object by providing a [`transformUserData()`](/reference/configure/lucia-configurations#transformuserdata) function in the configs. The raw column data will be passed on to the function. Lucia will use the return type as the type of the `User` object.

The default value is just as below:

```ts
export const auth = lucia({
	transformUserData: (userData) => {
		return {
			userId: userData.id
		};
	}
});
```

### Types

Add the column names and the value type inside `Lucia.UserAttributes`:

```ts
// app.d.ts
/// <reference types="lucia-auth" />
declare namespace Lucia {
	// ...
	interface UserAttributes {
		// here
	}
}
```

Refer to [Type declaration](/reference/types/lucia-namespace) for more.

## Set user attributes

You can define the user's attributes on creation by passing on the column/value object as `attributes` to [`createUser()`]().

```ts
import { auth } from "./lucia.js";

await auth.createUser({
	key: {
		// ...
	},
	attributes: {
		// pass on column/value
	}
});
```

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
