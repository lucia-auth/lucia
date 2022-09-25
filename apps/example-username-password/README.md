# Lucia username/password example

Example using [Lucia](https://github.com/pilcrowOnPaper/lucia-sveltekit/tree/main/packages/lucia-sveltekit) and [Supabase adapter](https://github.com/pilcrowOnPaper/lucia-sveltekit/tree/main/packages/adapter-supabase).

## Setup

```bash
npm install
npm run dev
```

### Environment variables

```bash
VITE_SUPABASE_URL=""
VITE_SUPABASE_SECRET="" # service_role

# something long (> 64 char) and random
VITE_LUCIA_SECRET=""
```

### Supabase

Create 2 tables:

- `user`
- `refresh_token`

> > **Make sure to enable row-level security for all of them.**

#### user

| column name      | type    | relations | nullable | unique | identity |
| ---------------- | ------- | --------- | -------- | ------ | -------- |
| id               | varchar |           |          | true   | true     |
| identifier_token | varchar |           |          | true   |          |
| hashed_password  | varchar |           | true     |        |          |
| `username`       | varchar |           |          | true   |          |

#### refresh_token

| column name   | type    | relations | nullable | unique | identity |
| ------------- | ------- | --------- | -------- | ------ | -------- |
| refresh_token | varchar |           |          | true   |          |
| user_id       | varchar | `user.id` |          |        |          |
