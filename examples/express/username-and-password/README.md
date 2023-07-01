# Username & password example with Lucia and Express

This example uses TypeScript, SQLite3 with `better-sqlite3`, and [`tsx`](https://github.com/esbuild-kit/tsx).

```bash
# install dependencies
pnpm i

# setup database
pnpm migrate

# run server + watch for changes
pnpm dev
```

## User schema

| id         | type     | unique |
| ---------- | -------- | :----: |
| `id`       | `string` |        |
| `username` | `string` |   ✓    |
