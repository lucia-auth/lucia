# Lucia Github OAuth example

Example using [Lucia](https://github.com/pilcrowOnPaper/lucia-sveltekit/tree/main/packages/lucia-sveltekit) and [Prisma adapter](https://github.com/pilcrowOnPaper/lucia-sveltekit/tree/main/packages/adapter-prisma) (PostgreSQL).

## Setup

```bash
npm install
npm run dev
```

### Environment variables

```bash
DATABASE_URL=""
VITE_GITHUB_CLIENT_ID=""
VITE_GITHUB_SECRET=""
VITE_LUCIA_SECRET=""
```

### Github 

Create Github OAuth app: https://docs.github.com/en/developers/apps/building-oauth-apps/creating-an-oauth-app

### Prisma

Connect your database

```bash
npx prisma migrate dev --name init
```

When using SQL languages other than PostgreSQL, change `@db.VarChar(300)` to the language's equivalent (refer to [this](https://www.prisma.io/docs/reference/api-reference/prisma-schema-reference#string))