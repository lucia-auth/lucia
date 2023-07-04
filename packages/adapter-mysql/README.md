# `@lucia-auth/adapter-mysql`

MySQL adapter for Lucia

**[Documentation](https://lucia-auth.com/database/mysql)**

**[Lucia documentation](https://lucia-auth.com)**

**[Changelog](https://github.com/pilcrowOnPaper/lucia/blob/main/packages/adapter-mysql/CHANGELOG.md)**

## Supported drivers

- [`mysql2`](https://github.com/sidorares/node-mysql2)

## Installation

```
npm install @lucia-auth/adapter-postgresql
pnpm add @lucia-auth/adapter-postgresql
yarn add @lucia-auth/adapter-postgresql
```

## Version compatibility

| `@lucia-auth/adapter-mysql` | `lucia-auth` | `mysql2` |
| --------------------------- | ------------ | -------- |
| `^1.0.0`                    | `^1.4.0`     | `^2.0.0` |

## Testing

Set MySQL database name and password in `.env`:

```bash
MYSQL2_DATABASE=""
MYSQL2_PASSWORD=""
```

### `mysql2`

```
pnpm test.mysql2
```

### `@planetscale/database`

Set up env var:

```bash
PLANETSCALE_HOST=""
PLANETSCALE_USERNAME=""
PLANETSCALE_PASSWORD= ""
```

Run:

```
pnpm test.planetscale
```
