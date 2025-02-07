# `@lifeworld/adapter-mysql`

MySQL adapter for Lucia.

**[Documentation](https://v3.lucia-auth.com/database/mysql#schema)**

**[Lucia documentation](https://v3.lucia-auth.com)**

**[Changelog](https://github.com/1ifeworld/lucia/blob/main/packages/adapter-mysql/CHANGELOG.md)**

## Supported drivers

-   [`mysql2`](https://github.com/sidorares/node-mysql2)
-   [Planetscale serverless driver](https://github.com/planetscale/database-js)

## Installation

```
npm install @lifeworld/adapter-postgresql
pnpm add @lifeworld/adapter-postgresql
yarn add @lifeworld/adapter-postgresql
```

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
PLANETSCALE_PASSWORD=""
```

Run:

```
pnpm test.planetscale
```
