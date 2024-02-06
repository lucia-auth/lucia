# `@lucia-auth/adapter-postgresql`

PostgreSQL adapter for Lucia.

**[Documentation](https://v3.lucia-auth.com/database/postgresql)**

**[Lucia documentation](https://v3.lucia-auth.com)**

**[Changelog](https://github.com/pilcrowOnPaper/lucia/blob/main/packages/adapter-postgresql/CHANGELOG.md)**

## Supported drivers

-   [node-postgres (`pg`)](https://github.com/brianc/node-postgres)
-   [Postgres.js (`postgres`)](https://github.com/porsager/postgres)
-   [Neon HTTP serverless driver](https://github.com/neondatabase/serverless)

## Installation

```
npm install @lucia-auth/adapter-postgresql
pnpm add @lucia-auth/adapter-postgresql
yarn add @lucia-auth/adapter-postgresql
```

## Testing

### node-postgres

Set PostgreSQL database connection url in `.env`:

```bash
POSTGRES_DATABASE_URL="postgresql://localhost/lucia"
```

```
pnpm test.node-postgres
```

### Postgres.js

Set PostgreSQL database connection url in `.env`:

```bash
POSTGRES_DATABASE_URL="postgresql://localhost/lucia"
```

```
pnpm test.postgresjs
```

### Neon HTTP

Set the connection URL in `.env`. Do not enable pooling.

```bash
NEON_CONNECTION_URL=""
```

```
pnpm test.neon-http
```
