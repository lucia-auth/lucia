---
_order: 0
title: "Database model"
---

Lucia uses adapters to connect to your database. The following chart shows the basic structure of the database, though they may vary from database to database.

## `user`

The `user` table stores the users. The `[any]` column represents the any number of columns you can add to store additional user attributes. Refer to [Store user attributes](/learn/basics/store-user-attributes). `id` should hold minimum of 15 chars for the default configuration.

| name  | type                   | unique | description                                       |
| ----- | ---------------------- | ------ | ------------------------------------------------- |
| id    | string (min. 15 chars) | true   |                                                   |
| [any] | any                    | any    | this represents any number of columns of any name |

### Schema type

```ts
// type imported from "lucia-auth/adapter"
type UserSchema = {
	id: string;
} & Lucia.UserAttributes;
```

## `session`

The `session` table stores the user's sessions. You do not need this if you're using the adapter for [`adapter.user`](/reference/configure/lucia-configurations#adapter) config.

| name           | type          | unique | reference | description                                        |
| -------------- | ------------- | ------ | --------- | -------------------------------------------------- |
| id             | string        | true   |           |                                                    |
| user_id        | string        |        | user(id)  |                                                    |
| active_expires | number (int8) |        |           | the expiration time (unix) of the session (active) |
| idle_expires   | number (int8) |        |           | the expiration time (unix) for the idle period     |

### Schema type

```ts
// type imported from "lucia-auth/adapter"
type SessionSchema = {
	id: string;
	active_expires: number;
	idle_expires: number;
	user_id: string;
};
```

## `key`

The `key` table stores the user's keys.

| name            | type           | unique | reference | description                                              |
| --------------- | -------------- | ------ | --------- | -------------------------------------------------------- |
| id              | string         | true   |           | key id in the form of: `${providerId}:${providerUserId}` |
| user_id         | string         |        | user(id)  |                                                          |
| primary         | boolean        |        |           | `true` for primary keys                                  |
| hashed_password | string \| null |        |           | hashed password of the key                               |

### Schema type

```ts
// type imported from "lucia-auth/adapter"
type SessionSchema = {
	id: string;
	user_id: string;
	primary: boolean;
	hashed_password: string | null;
};
```
