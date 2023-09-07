# Username & password example with Lucia and Express

This example uses TypeScript, SQLite3 with `better-sqlite3`, and [`tsx`](https://github.com/esbuild-kit/tsx).

```bash
# install dependencies
pnpm i

# run dev server + watch for changes
pnpm dev
```

## Runtime

This example is built for Node.js 20. If you're using Node.js 16/18, un-comment the following line in `src/lucia.ts`:

```ts
// import "lucia/polyfill/node";
```

## User schema

| id         | type     | unique |
| ---------- | -------- | :----: |
| `id`       | `string` |        |
| `username` | `string` |   ✓    |
