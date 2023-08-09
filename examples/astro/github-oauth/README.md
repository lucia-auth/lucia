# Github OAuth example with Lucia and Astro

This example uses SQLite3 with `better-sqlite3`.

```bash
# install dependencies
pnpm i

# setup .env
pnpm setup-env

# run dev server
pnpm dev
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
