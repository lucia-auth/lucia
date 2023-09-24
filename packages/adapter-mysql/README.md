# `@lucia-auth/adapter-mysql`

MySQL adapter for Lucia v2.

**[Documentation](https://lucia-auth.com/reference#lucia-authadapter-mysql)**

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

## Testing

Set MySQL database name and password in `.env`:

```bash
MYSQL2_DATABASE=""
MYSQL2_PASSWORD=""
```

### `mysql2`

```
pnpm test-setup.planetscale
pnpm test.mysql2
```

### `@planetscale/database`

Set up env var:

```bash
PLANETSCALE_HOST=""
PLANETSCALE_USERNAME=""
PLANETSCALE_PASSWORD=""
```

Run:

```
pnpm test-setup.planetscale
pnpm test.planetscale
```

### `prisma`

Set up env var:

```bash
PRISMA_DATABASE_URL=""
```

Run:

```
pnpm test-setup.prisma
pnpm test.prisma
```
