# `@lucia-auth/adapter-postgresql`

PostgreSQL adapter for Lucia v2.

**[Documentation](https://lucia-auth.com/reference#lucia-authadapter-postgresql)**

**[Lucia documentation](https://lucia-auth.com)**

**[Changelog](https://github.com/pilcrowOnPaper/lucia/blob/main/packages/adapter-postgresql/CHANGELOG.md)**

## Supported drivers

- [`pg`](https://github.com/brianc/node-postgres)
- [`postgres`](https://github.com/porsager/postgres)

## Installation

```
npm install @lucia-auth/adapter-postgresql
pnpm add @lucia-auth/adapter-postgresql
yarn add @lucia-auth/adapter-postgresql
```

## Testing

Set PostgreSQL database connection url in `.env`:

```bash
PSQL_DATABASE_URL="postgresql://localhost/test"
```

### `pg`

```
pnpm test-setup.pg
pnpm test.pg
```

### `postgres`

```
pnpm test-setup.postgres
pnpm test.postgres
```

### `prisma`

```
pnpm test-setup.prisma
pnpm test.prisma
```
