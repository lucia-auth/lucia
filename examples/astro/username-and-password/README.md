# Username & password example with Lucia and Astro

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

| id         | type     | unique |
| ---------- | -------- | :----: |
| `id`       | `string` |        |
| `username` | `string` |   ✓    |
