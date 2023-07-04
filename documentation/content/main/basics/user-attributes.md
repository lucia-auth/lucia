---
_order: 3
title: "User attributes"
description: "Learn about user attributes in Lucia"
---

In addition to the required user id, you can add any columns/fields to the user table to store user attributes.

> It’s recommended to only store data for identification (e.g. username) and access controls (e.g. roles) inside the user table. Other data linked to the user should be stored in its own table.

Lucia will re-throw the error from the database on user creation/update if the provided data violates constraints/rules.

## Populate `User` object

By default, the `User` object (returned by methods like [`getUser()`](/reference/lucia-auth/auth#getuser) only includes the user id:

```ts
type User = {
	userId: string;
};
```

You can customize this object by providing a [`transformDatabaseUser()`](/basics/configuration#transformuserdata) function in the configs. The raw column data will be passed on to the function. Lucia will use the return type as the type of the `User` object.

The default value is just as below:

```ts
export const auth = lucia({
	transformDatabaseUser: (userData) => {
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
	type UserAttributes = {
		some_column: SomeType;
	};
}
```

If you have a column that has a default value, you can make the column optional by adding `?`. This will be a required field when passed onto `transformDatabaseUser()`.

```ts
type UserAttributes = {
	some_column?: SomeType;
};
```

## Set user attributes

You can define the user's attributes on creation by passing on the column/value object as `attributes` to [`createUser()`](/reference/lucia-auth/auth#createuser).

```ts
import { auth } from "./lucia.js";

await auth.createUser({
	primaryKey: {
		// ...
	},
	attributes: {
		// pass on column/value
	}
});
```

#### Example

To store a user's username, for example, a `username` column should be added to the `user` table:

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

This username column can be accessed with `userData.username` inside `transformDatabaseUser()` in config:

```ts
export const auth = lucia({
	transformDatabaseUser: (userData) => {
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
