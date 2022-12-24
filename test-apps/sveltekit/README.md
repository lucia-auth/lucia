# Lucia + Sveltekit demo

## Setup

### Install dependencies

```bash
pnpm i
```

### Prisma

Migrate Prisma schema:

```bash
npx prisma migrate dev --name init
```

### Github OAuth

Create a Github OAuth app and copy-paste client id and secret into `.env`.
Set the Authorization callback URL of your Github OAuth app to `http://localhost:5173/api/oauth/github/`

## Run

```bash
pnpm dev
```
