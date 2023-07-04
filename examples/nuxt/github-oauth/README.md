# Username & password example with Lucia and Nuxt

This example uses `better-sqlite3`.

```bash
# install dependencies
pnpm i

# setup .env
pnpm setup-env

# setup database
pnpm migrate

# run
pnpm dev
```

## Runtime

This example is built for Node.js 20. If you're using Node.js 16/18, un-comment the following lines in `server/utils/lucia.ts`:

```ts
// import "lucia/polyfill/node";
```

and in `nuxt.config.ts`:

```ts
// nitro: {
// 	moduleSideEffects: ["lucia/polyfill/node"]
// }
```

## Setup Github OAuth

[Create a new Github OAuth app](https://docs.github.com/en/apps/oauth-apps/building-oauth-apps/creating-an-oauth-app). The redirect uri should be set to `localhost:5173/login/github/callback`. Copy and paste the client id and secret into `.env`.

```bash
GITHUB_CLIENT_ID=""
GITHUB_CLIENT_SECRET=""
```

## User schema

| id                | type     | unique |
| ----------------- | -------- | :----: |
| `id`              | `string` |        |
| `github_username` | `string` |        |
