---
order: 0
title: "Supabase"
---

An adapter for Supabase PostgreSQL database - can be used regardless of the Supabase version. **Make sure to enable row level security for all tables!**.

```ts
const adapter: (
	url: string,
	secret: string,
	errorHandler?: (error: PostgrestError) => void
) => Adapter;
```

### Parameter

`handleError()` may be provided which will be called on [unknown errors](/learn/basics/error-handling#known-errors) - database errors Lucia doesn't expect the adapter to catch. You can also throw custom errors inside it, which will be thrown when an unknown database error occurs inside [`Lucia`](/reference/api/server-api#lucia-default) methods.

| name        | type       | description                         | optional |
| ----------- | ---------- | ----------------------------------- | -------- |
| url         | `string`   | Supabase project url                |          |
| secret      | `string`   | `service_role` secret; NOT anon key |          |
| handleError | `Function` |                                     | true     |

### Errors

When an adapter encounters an unknown error (described above), it will throw `PostgrestError`.

## Installation

```bash
npm i @lucia-auth/adapter-fauna
pnpm add @lucia-auth/adapter-fauna
yarn add @lucia-auth/adapter-fauna
```

## Usage

```ts
import fauna from "@lucia-auth/adapter-fauna";
import faunadb from "faunadb";

const { Client } = faunadb;

const auth = lucia({
	adapter: fauna(new Client({...options}))
});
```

## Database structure

Create collections:
```js
CreateCollection({ name: "user" })
CreateCollection({ name: "session" })
```

Create Indexes:
```js
CreateIndex({
  name: "user_by_id",
  source: Collection("user"),
  unique: true,
  terms: [{ field: ["data", "id"] }]
})
CreateIndex({
  name: "session_by_id",
  source: Collection("sessions"),
  unique: true,
  terms: [{ field: ["data", "id"] }]
})
CreateIndex({
  name: "session_by_userid",
  source: Collection("sessions"),
  unique: true,
  terms: [{ field: ["data", "user_id"] }]
})
CreateIndex({
    name: "user_by_providerid",
    source: Collection("users"),
    unique: true,
    terms: [{ field: ["data", "provider_id"] }]
})
```

Create upsert helper function:
```bash
CreateFunction({
  name: "upsert",
  body: Query(
    Lambda(
      ["ref", "data"],
      If(
        Exists(Var("ref")),
        Update(Var("ref"), Var("data")),
        Create(Var("ref"), Var("data"))
      )
    )
  )
})
```

`uuid` should be changed to `varchar` if you use custom user ids.

### `user`

You may add additional columns to store user attributes. Refer to [Store user attributes](/learn/basics/store-user-attributes). `id` may be `varchar` if you generate your own user id.

| name            | type   | foreign constraint | default              | nullable | unique | identity |
| --------------- | ------ | ------------------ | -------------------- | -------- | ------ | -------- |
| id              | `uuid` |                    | `uuid_generate_v4()` |          | true   | true     |
| provider_id     | `text` |                    |                      |          | true   |          |
| hashed_password | `text` |                    |                      | true     |        |          |

### `session`

This is not required if you're only using the Supabase adapter for the `user` table via [`adapter.user`](/reference/configure/lucia-configurations#adapter) config.

| name         | type   | foreign constraint | nullable | unique | identity |
| ------------ | ------ | ------------------ | -------- | ------ | -------- |
| id           | `text` |                    |          | true   | true     |
| user_id      | `uuid` | `public.user(id)`  |          |        |          |
| expires      | `int8` |                    |          |        |          |
| idle_expires | `int8` |                    |          |        |          |

## Supabase SQL Editor

`UUID` in `user` table should be changed to `TEXT` if you use custom user ids.
You may add additional columns to store custom user data in `user` table. Refer to [Store user attributes](/learn/basics/store-user-attributes).

```sql
CREATE TABLE public.user (
	id UUID DEFAULT extensions.uuid_generate_v4() PRIMARY KEY,
	provider_id TEXT NOT NULL UNIQUE,
	hashed_password TEXT NULL
);

CREATE TABLE public.session (
  	id TEXT PRIMARY KEY,
	user_id UUID REFERENCES public.user(id),
	expires INT8 NOT NULL,
	idle_expires INT8 NOT NULL
);

ALTER TABLE public.user ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.session ENABLE ROW LEVEL SECURITY;

COMMENT ON TABLE public.user IS '[Lucia] Users';
COMMENT ON TABLE public.session IS '[Lucia] User Sessions';
```
