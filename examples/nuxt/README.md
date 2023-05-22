# Lucia + Nuxt demo

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
NUXT_GITHUB_CLIENT_ID=""
NUXT_GITHUB_CLIENT_SECRET=""
```

## Run

```
pnpm dev
```
