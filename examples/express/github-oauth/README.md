# GitHub OAuth example with Lucia and Express

This example uses TypeScript, SQLite3 with `better-sqlite3`, and [`tsx`](https://github.com/esbuild-kit/tsx). Make sure to setup your `.env` file.

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

## Setup GitHub OAuth

[Create a new GitHub OAuth app](https://docs.github.com/en/apps/oauth-apps/building-oauth-apps/creating-an-oauth-app). The redirect uri should be set to `localhost:5173/login/github/callback`. Copy and paste the client id and secret into `.env`.

```bash
GITHUB_CLIENT_ID=""
GITHUB_CLIENT_SECRET=""
```

## User schema

| id         | type     | unique |
| ---------- | -------- | :----: |
| `id`       | `string` |        |
| `username` | `string` |        |
