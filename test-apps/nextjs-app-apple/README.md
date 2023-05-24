# Lucia + Next.js demo

Uses the `app` router.

## Setup

### Install dependencies

```
pnpm i
```

### Prisma

Migrate Prisma schema:

```
pnpm prisma migrate dev --name init
```

### Github OAuth

Create a Github OAuth app and copy-paste client id and secret into `.env`.

```bash
# .env
GITHUB_CLIENT_ID=""
GITHUB_CLIENT_SECRET=""
APPLE_TEAM_ID=""
APPLE_KEY_ID=""
APPLE_CERT_PATH=""
APPLE_REDIRECT_URI=""
APPLE_CLIENT_ID=""
```

## Run

```
pnpm dev
```
