# Email & password example with Lucia and Next.js App Router

This example uses `better-sqlite3`.

```bash
# install dependencies
pnpm i

# run dev server
pnpm dev
```

## Runtime

This example is built for Node.js 20. If you're using Node.js 16/18, un-comment the following lines in `auth/lucia.ts`:

```ts
// import "lucia/polyfill/node";
```

## User schema

| id               | type                    | unique |
| ---------------- | ----------------------- | :----: |
| `id`             | `string`                |        |
| `email`          | `string`                |   ✓    |
| `email_verified` | `number` (as `boolean`) |   ✓    |
