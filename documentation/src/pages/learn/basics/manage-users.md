---
order: 7
layout: "@layouts/DocumentLayout.astro"
title: "Manage users"
---

Updating the current user will not be automatically reflected in the client. Make sure to refresh the page after it.

## Update user

Lucia provides few methods to update the user, one for each user attribute. Lucia currently does not provide a way to update the user id. All of the methods return the updated user.

### Provider id

The provider id can be updated using the [`updateUserProviderId()`](/reference/api/server-api#updateuserproviderid) method. Both the provider name and identifier must be provided.

```ts
import { auth } from "$lib/server/lucia";

try {
    const user = await auth.updateUserProviderId(userId, provider, identifier);
} catch {
    // invalid input
}
```

### Password

The password can be updated using the [`updateUserPassword()`](/reference/api/server-api#updateuserpassword) method. Lucia will handle the hashing.

```ts
import { auth } from "$lib/server/lucia";

const user = await auth.updateUserPassword(userId, password);
```

### User data

Additional user data stored in the database can be updated using the [`updateUserData()`](/reference/api/server-api#updateuserdata) method. Only the user data attribute (column) that needs to updated has to be password. `undefined` values will be ignored, while `null` will not.

Refer to [Store additional user data](/learn/basics/store-additional-user-data) for more information on storing additional user data.

```ts
import { auth } from "$lib/server/lucia";

const user = await auth.updateUserData(userId, partialUserData);
```

#### Example

```ts
import { auth } from "$lib/server/lucia";

try {
    const user = await auth.updateUserData(userId, {
        phoneNumber: "000-0000-0000",
        profilePicture: null,
    });
} catch {
    // invalid input
}
```

## Delete user

Users can be deleted using the [`deleteUser()`](/reference/api/server-api#deleteuser) method. All sessions and refresh tokens of the target user will be deleted as well. This method will succeed regardless of the validity of the user id.

```ts
import { auth } from "$lib/server/lucia";

const user = auth.deleteUser(userId);
```
