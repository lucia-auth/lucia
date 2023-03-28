---
_order: 1
title: "Database model"
description: "Learn the basic database model required for Lucia"
---

Lucia uses adapters to connect to your database. The following chart shows the basic structure of the database, though they may vary from database to database.

## `auth_user`

Schema: [`UserSchema`](/reference/lucia-auth/types#userschema)

The `auth_user` table stores the users. The `[any]` column represents the any number of columns you can add to store additional user attributes. Refer to [User attributes](/basics/user-attributes). `id` should hold minimum of 15 chars for the default configuration.

| name  | type                   | unique | description                                       |
| ----- | ---------------------- | ------ | ------------------------------------------------- |
| id    | string (min. 15 chars) | true   |                                                   |
| [any] | any                    | any    | this represents any number of columns of any name |

```ts
type UserSchema = {
	id: string;
} & Lucia.UserAttributes;
```

## `auth_session`

Schema: [`SessionSchema`](/reference/lucia-auth/types#sessionschema)

The `session` table stores the user's sessions. You do not need this if you're using the adapter for [`adapter.user`](/basics/configuration#adapter) config.

| name           | type          | unique | reference | description                                        |
| -------------- | ------------- | ------ | --------- | -------------------------------------------------- |
| id             | string        | true   |           |                                                    |
| user_id        | string        |        | user(id)  |                                                    |
| active_expires | number (int8) |        |           | the expiration time (unix) of the session (active) |
| idle_expires   | number (int8) |        |           | the expiration time (unix) for the idle period     |

```ts
type SessionSchema = {
	id: string;
	active_expires: number;
	idle_expires: number;
	user_id: string;
};
```

## `auth_key`

Schema: [`KeySchema`](/reference/lucia-auth/types#keyschema)

The `key` table stores the user's keys.

| name            | type           | unique | reference | description                                              |
| --------------- | -------------- | ------ | --------- | -------------------------------------------------------- |
| id              | string         | true   |           | key id in the form of: `${providerId}:${providerUserId}` |
| user_id         | string         |        | user(id)  |                                                          |
| primary_key     | boolean        |        |           | `true` for primary keys                                  |
| hashed_password | string \| null |        |           | hashed password of the key                               |
| expires         | number \| null |        |           | expiration for key if defined (`number`)                 |

```ts
type KeySchema = {
	id: string;
	user_id: string;
	primary_key: boolean;
	hashed_password: string | null;
	expires: number | null;
};
```
