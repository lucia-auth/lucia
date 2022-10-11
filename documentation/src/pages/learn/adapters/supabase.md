---
order: 1
layout: "@layouts/DocumentLayout.astro"
title: "Supabase"
---

An adapter for Supabase (v1) PostgreSQL database.

```ts
const adapter: (url: string, secret: string) => Adapter;
```

### Parameter

| name   | type     | description                         |
| ------ | -------- | ----------------------------------- |
| url    | `string` | Supabase project url                |
| secret | `string` | `service_role` secret; NOT anon key |


## Installation

```bash
npm i @lucia-sveltekit/adapter-supabase
pnpm add @lucia-sveltekit/adapter-supabase
yarn add @lucia-sveltekit/adapter-supabase
```

## Usage

```ts
import supabase from "@lucia-sveltekit/adapter-supabase";

const auth = lucia({
    adapter: supabase(url, secret),
});
```

## Database structure

`uuid` should be changed to `varchar` if you use custom user ids.

### `user`

You may add additional columns to store custom user data. Refer to [Store additional user data](/learn/basics/store-additional-user-data).

| name            | type      | foreign constraint | default              | nullable | unique | identity |
| --------------- | --------- | ------------------ | -------------------- | -------- | ------ | -------- |
| id              | `uuid`    |                    | `generate_uuid_v4()` |          | true   | true     |
| provider_id     | `varchar` |                    |                      |          | true   |          |
| hashed_password | `string`  |                    |                      | true     |        |          |

### `session`

| name         | type      | foreign constraint | nullable | unique | identity |
| ------------ | --------- | ------------------ | -------- | ------ | -------- |
| id           | `int8`    |                    |          | true   | true     |
| user_id      | `uuid`    | `primary:user.id`  |          |        |          |
| access_token | `varchar` |                    |          | true   |          |
| expires      | `int8`    |                    |          |        |          |

### `refresh_token`

| name          | type      | foreign constraint | nullable | unique | identity |
| ------------- | --------- | ------------------ | -------- | ------ | -------- |
| id            | `int8`    |                    |          | true   | true     |
| user_id       | `uuid`    | `primary:user.id`  |          |        |          |
| refresh_token | `varchar` |                    |          | true   |          |
