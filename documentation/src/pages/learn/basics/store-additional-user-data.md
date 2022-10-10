---
order: 1
layout: "@layouts/DocumentLayout.astro"
title: "Storing additional user data"
---

Any number of additional columns can be added to the `user` table, and it will be included to the `User` object alongside with the user id (`.userId`). This should be generally used for commonly used data (like username and profile pictures) and for user permissions (like if the user is an admin). Larger and specific data should be stored inside a different table.

The column name should be written in `snake_case`, and the data will be accessible in `User` as **`camelCase`**. The column can be unique as well, and Lucia will throw an error when a provided user data violates the unique rule upon user creation or update.

## Example

To store user's phone number, for example, a `phone_number` column should be added to the `user` table:

| column          | type   |
| --------------- | ------ |
| id              | string |
| hashed_password | string |
| provider_id     | string |
| phone_number    | string |

This phone number can be accessed with `user.phoneNumber` (notice that `phone_number` was converted to `phoneNumber`):

```ts
import { auth } from "$lib/server/lucia.ts";

const user = await auth.getUser();
const phoneNumber = user.phoneNumber;
```
