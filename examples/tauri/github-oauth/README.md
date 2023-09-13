# GitHub OAuth example with Lucia and Tauri

This example has 2 parts: the Tauri application and the TS server with Lucia. Uses SQLite3 with `better-sqlite3` as the database.

## App

Inside `app` directory.

```bash
# install dependencies
pnpm i

# run dev server
pnpm tauri dev
```

## Server

Inside `server` directory. Runs on `http://localhost:3000`.

```bash
# install dependencies
pnpm i

# setup .env
pnpm setup-env

# run dev server
pnpm start
```

## Setup GitHub OAuth

[Create a new GitHub OAuth app](https://docs.github.com/en/apps/oauth-apps/building-oauth-apps/creating-an-oauth-app). The redirect uri should be set to `localhost:5173/login/github/callback`. Copy and paste the client id and secret into `.env`.

```bash
GITHUB_CLIENT_ID=""
GITHUB_CLIENT_SECRET=""
```

## User schema

| id         | type     |
| ---------- | -------- |
| `id`       | `string` |
| `username` | `string` |
