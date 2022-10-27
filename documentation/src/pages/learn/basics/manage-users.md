---
order: 5
layout: "@layouts/DocumentLayout.astro"
title: "Manage users"
---

Updating the current user will not be automatically reflected in the client. Make sure to refresh the page after it.

## Update users

Lucia provides few methods to update the user, one for each user attribute. Lucia currently does not provide a way to update the user id; please open a new issue if you encounter a use case for it. All of the methods return the updated user.

### Provider id

The provider id can be updated using the [`updateUserProviderId()`](/reference/api/server-api#updateuserproviderid) method. Both the provider name and identifier must be provided.

```ts
import { auth } from "./lucia.js";

try {
	const user = await auth.updateUserProviderId(userId, provider, identifier);
} catch {
	// invalid input
}
```

### Password

The password can be updated using the [`updateUserPassword()`](/reference/api/server-api#updateuserpassword) method. Lucia will handle the hashing.

```ts
import { auth } from "./lucia.js";

const user = await auth.updateUserPassword(userId, password);
```

### User attributes

Additional user attributes stored in the database can be updated using the [`updateUserAttributes()`](/reference/api/server-api#updateuserattributes) method. Only the user data attribute (column) that needs to updated has to be passed. `undefined` values will be ignored, while `null` will not.

Refer to [Store user attributes](/learn/basics/store-user-attributes) for more information on storing additional user data.

```ts
import { auth } from "./lucia.js";

const user = await auth.updateUserAttributes(userId, partialUserAttributes);
```

#### Example

```ts
import { auth } from "./lucia.js";

try {
	const user = await auth.updateUserAttributes(userId, {
		username: "",
		profile_picture: null
	});
} catch {
	// invalid input
}
```

## Delete user

Users can be deleted using the [`deleteUser()`](/reference/api/server-api#deleteuser) method. All sessions and refresh tokens of the target user will be deleted as well. This method will succeed regardless of the validity of the user id.

```ts
import { auth } from "./lucia.js";

const user = auth.deleteUser(userId);
```
