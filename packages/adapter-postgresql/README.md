# `@lucia-auth/adapter-postgresql`

PostgreSQL adapter for Lucia v3.

**[Documentation](https://lucia-auth.com/reference#lucia-authadapter-postgresql)**

**[Lucia documentation](https://v3.lucia-auth.com)**

**[Changelog](https://github.com/pilcrowOnPaper/lucia/blob/main/packages/adapter-postgresql/CHANGELOG.md)**

## Supported drivers

- [node-postgres (`pg`)](https://github.com/brianc/node-postgres)
- [Postgres.js (`postgres`)](https://github.com/porsager/postgres)

## Installation

```
npm install @lucia-auth/adapter-postgresql@beta
pnpm add @lucia-auth/adapter-postgresql@beta
yarn add @lucia-auth/adapter-postgresql@beta
```

## Testing

Set PostgreSQL database connection url in `.env`:

```bash
POSTGRES_DATABASE_URL="postgresql://localhost/lucia"
```

### node-postgres

```
pnpm test.node-postgres
```

### Postgres.js

```
pnpm test.postgresjs
```
