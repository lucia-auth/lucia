# GitHub OAuth example with Lucia and Electron

This example has 2 parts: the Electron application and the TS server with Lucia. Uses SQLite3 with `better-sqlite3` as the database.

## App

Inside `app` directory. **Electron Forge does not support PNPM.**

```bash
# install dependencies
npm i

# run dev server
npm run start
```

## Server

Inside `server` directory. Make sure to setup your `.env` file.

```bash
# install dependencies
pnpm i

# run server on port 3000
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
