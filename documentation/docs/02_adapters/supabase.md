## Overview

An adapter to use with Supabase's PostgreSQL database.

```ts
import supabase from "@lucia-sveltekit/adapter-supabase"

const auth = Lucia({
	adapter: supabase(url, secret)
	// ...
})
```

### Parameters

| name   | type   | description                   |
| ------ | ------ | ----------------------------- |
| url    | string | Supabase project url          |
| secret | string | Supabase "service_role" secret |

## Setting up the database

Create 2 tables:

-   `users`
-   `refresh_tokens`

> > **Make sure to enable row-level security for all of them.**

### users

| column name      | type    | relations | nullable | unique | identity |
| ---------------- | ------- | -------- | -------- | ------ | -------- |
| id               | varchar |          |          | true   | true     |
| identifier_token | varchar |          |          | true   |          |
| hashed_password  | varchar |          |          |        |          |
| [user_data]      | any     | any      | true     | any    |          |

### refresh_tokens

| column name   | type    | relations   | nullable | unique | identity |
| ------------- | ------- | ---------- | -------- | ------ | -------- |
| id            | int8    |            |          | true   | true     |
| refresh_token | varchar |            |          | true   |          |
| user_id       | varchar | `users.id` |          |        |          |