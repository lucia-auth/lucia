---
_order: 1
title: "Database model"
description: "Learn the basic database model required for Lucia"
---

Lucia uses adapters to connect to your database. While you can store the provided data in whatever structure is appropriate, it should follow certain constraints (unique, foreign key).

## `auth_user`

The `auth_user` table stores the users. The `[any]` column represents the any number of columns you can add to store additional user attributes. Refer to [User attributes](/basics/user-attributes). `id` should hold minimum of 15 chars for the default configuration.

| name  | type                     | unique | description                                       |
| ----- | ------------------------ | :----: | ------------------------------------------------- |
| id    | `string` (min. 15 chars) |   ✓    |                                                   |
| [any] | any                      |  any   | this represents any number of columns of any name |

```ts
type UserSchema = {
	id: string;
} & Lucia.UserAttributes;
```

## `auth_session`

The `auth_session` table stores the user's sessions.

| name           | type            | unique | foreign key | description                                        |
| -------------- | --------------- | :----: | ----------- | -------------------------------------------------- |
| id             | `string`        |   ✓    |             |                                                    |
| user_id        | `string`        |        | `user(id)`  |                                                    |
| active_expires | `number` (int8) |        |             | the expiration time (unix) of the session (active) |
| idle_expires   | `number` (int8) |        |             | the expiration time (unix) for the idle period     |

```ts
type SessionSchema = {
	id: string;
	active_expires: number;
	idle_expires: number;
	user_id: string;
};
```

## `auth_key`

The `auth_key` table stores the user's keys.

| name            | type             | unique | foreign key | description                                              |
| --------------- | ---------------- | :----: | ----------- | -------------------------------------------------------- |
| id              | `string`         |   ✓    |             | key id in the form of: `${providerId}:${providerUserId}` |
| user_id         | `string`         |        | `user(id)`  |                                                          |
| primary_key     | `boolean`        |        |             | `true` for primary keys                                  |
| hashed_password | `string \| null` |        |             | hashed password of the key                               |
| expires         | `number \| null` |        |             | expiration for key if defined (`number`)                 |

```ts
type KeySchema = {
	id: string;
	user_id: string;
	primary_key: boolean;
	hashed_password: string | null;
	expires: number | null;
};
```
