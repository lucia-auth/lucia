# Lucia username/password example

Example using [Lucia](https://github.com/pilcrowOnPaper/lucia-sveltekit/tree/main/packages/lucia-sveltekit) and [Supabase adapter](https://github.com/pilcrowOnPaper/lucia-sveltekit/tree/main/packages/adapter-supabase).

## Setup

```bash
npm install
npm run dev
```

### Environment variables

```bash
SUPABASE_URL=""
SUPABSE_SECRET="" # service_role

# something long (> 64 char) and random
VITE_LUCIA_SECRET=""
```

### Supabase

Create 2 tables:

- `users`
- `refresh_tokens`

> > **Make sure to enable row-level security for all of them.**

#### users

`[user_data]` represents any number of additional columns that may be used.

| column name      | type    | relations | nullable | unique   | identity |
| ---------------- | ------- | --------- | -------- | -------- | -------- |
| id               | varchar |           |          | true     | true     |
| identifier_token | varchar |           |          | true     |          |
| hashed_password  | varchar |           | true     |          |          |
| [user_data]      | any     | any       | true     | optional |          |

#### refresh_tokens

| column name   | type    | relations  | nullable | unique | identity |
| ------------- | ------- | ---------- | -------- | ------ | -------- |
| id            | int8    |            |          | true   | true     |
| refresh_token | varchar |            |          | true   |          |
| user_id       | varchar | `users.id` |          |        |          |
