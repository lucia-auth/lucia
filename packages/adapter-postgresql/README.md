# `@lucia-auth/adapter-postgresql`

PostgreSQL adapter for Lucia

**[Documentation](https://lucia-auth.com/database/postgresql)**

**[Lucia documentation](https://lucia-auth.com)**

**[Changelog](https://github.com/pilcrowOnPaper/lucia/blob/main/packages/adapter-postgresql/CHANGELOG.md)**

## Supported drivers

- [`pg`](https://github.com/brianc/node-postgres)

## Installation

```
npm install @lucia-auth/adapter-postgresql
pnpm add @lucia-auth/adapter-postgresql
yarn add @lucia-auth/adapter-postgresql
```

## Version compatibility

| `@lucia-auth/adapter-postgresql` | `lucia-auth` | `pg`     |
| -------------------------------- | ------------ | -------- |
| `^1.0.0`                         | `^1.4.0`     | `^8.0.0` |

## Testing

Set PostgreSQL database connection url in `.env`:

```bash
PSQL_DATABASE_URL="postgresql://localhost/lucia"
```

### `pg`

```
pnpm test.pg
```
