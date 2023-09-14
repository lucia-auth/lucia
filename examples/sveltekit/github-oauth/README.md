# GitHub OAuth example with Lucia and SvelteKit

This example uses SQLite3 with `better-sqlite3`. Make sure to setup your `.env` file.

```bash
# install dependencies
pnpm i

# run dev server
pnpm dev
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
