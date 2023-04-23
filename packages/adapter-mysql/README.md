# `@lucia-auth/adapter-mysql`

MySQL adapter for Lucia

**[Documentation](https://lucia-auth.com/database/sqlite)**

**[Lucia documentation](https://lucia-auth.com)**

**[Changelog](https://github.com/pilcrowOnPaper/lucia/blob/main/packages/adapter-sqlite/CHANGELOG.md)**

## Supported drivers

- [`mysql2`](https://github.com/sidorares/node-mysql2)

## Installation

```
npm install @lucia-auth/adapter-prisma
pnpm add @lucia-auth/adapter-prisma
yarn add @lucia-auth/adapter-prisma
```

## Version compatibility

| `@lucia-auth/adapter-mysql` | `lucia-auth` | `mysql2` |
| --------------------------- | ------------ | -------- |
| `^1.0.0`                    | `^1.3.0`     | `^2.0.0` |

## Testing

Set MySQL database name and password to `.env`:

```bash
MYSQL_DATABASE=""
MYSQL_PASSWORD=""
```

### `mysql2`

```
pnpm test.mysql2
```
