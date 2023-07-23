# Email & password example with Lucia and SvelteKit

This example uses SQLite3 with `better-sqlite3`.

```bash
# install dependencies
pnpm i

# setup database
pnpm migrate

# run server
pnpm dev
```

## User schema

| id               | type                    | unique |
| ---------------- | ----------------------- | :----: |
| `id`             | `string`                |        |
| `email`          | `string`                |   ✓    |
| `email_verified` | `number` (as `boolean`) |   ✓    |
