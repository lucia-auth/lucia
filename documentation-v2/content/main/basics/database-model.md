---
order: -1
title: "Database model"
description: "Learn Lucia's basic database model"
---

Lucia requires 3 tables to work, which are then connected to Lucia via a database adapter. This is only the basic model and the specifics depend on the adapter.

## User table

In addition to the required fields shown below, you can add any additional fields which should be [declared in type `Lucia.DatabaseUserAttributes`](). You can then [define custom user attributes]().

| name | type     | primary key | description |
| ---- | -------- | :---------: | ----------- |
| id   | `string` |      ✓      | User id     |

```ts
type UserSchema = {
	id: string;
} & Lucia.DatabaseUserAttributes;
```

## Session table

In addition to the required fields shown below, you can add any additional fields which should be [declared in type `Lucia.DatabaseSessionAttributes`](). You can then [define custom session attributes]().

| name           | type            | primary key | references | description                                        |
| -------------- | --------------- | :---------: | ---------- | -------------------------------------------------- |
| id             | `string`        |      ✓      |            |                                                    |
| user_id        | `string`        |             | `user(id)` |                                                    |
| active_expires | `number` (int8) |             |            | The expiration time (unix) of the session (active) |
| idle_expires   | `number` (int8) |             |            | The expiration time (unix) for the idle period     |

```ts
type SessionSchema = {
	id: string;
	active_expires: number;
	idle_expires: number;
	user_id: string;
} & Lucia.DatabaseSessionAttributes;
```

## Key table

| name            | type             | primary key | references | description                                              |
| --------------- | ---------------- | :---------: | ---------- | -------------------------------------------------------- |
| id              | `string`         |      ✓      |            | Key id in the form of: `${providerId}:${providerUserId}` |
| user_id         | `string`         |             | `user(id)` |                                                          |
| hashed_password | `string \| null` |             |            | Hashed password of the key                               |

```ts
type KeySchema = {
	id: string;
	user_id: string;
	hashed_password: string | null;
};
```
