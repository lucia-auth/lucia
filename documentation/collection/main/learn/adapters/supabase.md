---
_order: 0
title: "Supabase"
---

An adapter for Supabase PostgreSQL database - can be used regardless of the Supabase version. **Make sure to enable row level security for all tables!**.

```ts
const adapter: (url: string, secret: string) => AdapterFunction<Adapter>;
```

### Parameter

| name   | type     | description                         | optional |
| ------ | -------- | ----------------------------------- | -------- |
| url    | `string` | Supabase project url                |          |
| secret | `string` | `service_role` secret; NOT anon key |          |

### Errors

The adapter and Lucia will not handle [unknown errors](/learn/basics/error-handling#known-errors), database errors Lucia doesn't expect the adapter to catch. When an adapter encounters such errors, it will throw a `PostgrestError`.

## Installation

```bash
npm i @lucia-auth/adapter-supabase
pnpm add @lucia-auth/adapter-supabase
yarn add @lucia-auth/adapter-supabase
```

## Usage

```ts
import supabase from "@lucia-auth/adapter-supabase";

const auth = lucia({
	adapter: supabase(url, secret)
});
```

## Database structure

### `user`

`id` may be `TEXT` if you generate your own user id. You may add additional columns to store user attributes. Refer to [Store user attributes](/learn/basics/store-user-attributes). `id` may be `varchar` if you generate your own user id.

| name | type      | foreign constraint | nullable | unique | identity |
| ---- | --------- | ------------------ | -------- | ------ | -------- |
| id   | `varchar` |                    |          | true   | true     |

### `session`

This is not required if you're only using the Supabase adapter for the `user` table via [`adapter.user`](/reference/configure/lucia-configurations#adapter) config.

| name         | type      | foreign constraint | nullable | unique | identity |
| ------------ | --------- | ------------------ | -------- | ------ | -------- |
| id           | `text`    |                    |          | true   | true     |
| user_id      | `varchar` | `public.user(id)`  |          |        |          |
| expires      | `int8`    |                    |          |        |          |
| idle_expires | `int8`    |                    |          |        |          |

### `key`

Column type of `user_id` should match the type of `public.user(id)`.

| name            | type      | foreign constraint | nullable | unique | identity |
| --------------- | --------- | ------------------ | -------- | ------ | -------- |
| id              | `text`    |                    |          | true   | true     |
| user_id         | `varchar` | `public.user(id)`  |          |        |          |
| hashed_password | `text`    |                    | true     |        |          |
| primary         | `boolean` |                    |          |        |          |

## Supabase SQL Editor

You may add additional columns to store custom user data in `user` table. Refer to [Store user attributes](/learn/basics/store-user-attributes).

```sql
CREATE TABLE public.user (
    id TEXT PRIMARY KEY
);
CREATE TABLE public.session (
    id TEXT PRIMARY KEY,
    user_id TEXT REFERENCES public.user(id) NOT NULL,
    active_expires BIGINT NOT NULL,
    idle_expires BIGINT NOT NULL
);
CREATE TABLE public.key (
    id TEXT PRIMARY KEY,
    user_id TEXT REFERENCES public.user(id) NOT NULL,
    "primary" BOOLEAN NOT NULL,
    hashed_password TEXT
);

ALTER TABLE public.user ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.session ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.key ENABLE ROW LEVEL SECURITY;
```
