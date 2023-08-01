# `@lucia-auth/adapter-sqlite`

SQLite adapter for Lucia v2.

**[Documentation](https://lucia-auth.com/reference#lucia-authadapter-prisma)**

**[Lucia documentation](https://lucia-auth.com)**

**[Changelog](https://github.com/pilcrowOnPaper/lucia/blob/main/packages/adapter-sqlite/CHANGELOG.md)**

## Supported drivers

- [`better-sqlite3`](https://github.com/WiseLibs/better-sqlite3)
- [libSQL](https://github.com/libsql/libsql) (Turso)

## Installation

```
npm install @lucia-auth/adapter-sqlite
pnpm add @lucia-auth/adapter-sqlite
yarn add @lucia-auth/adapter-sqlite
```

## Testing

### `better-sqlite3`

```
pnpm test.better-sqlite3
```

### Cloudflare D1

Make sure [Wrangler is installed](https://developers.cloudflare.com/workers/wrangler/install-and-update/).

Create a new `d1` database by running:

```ts
wrangler d1 create <DATABASE_NAME>
```

This will return the database binding, name, and id. Set those in `.env`:

```bash
D1_DATABASE_BINDING=""
D1_DATABASE_NAME=""
D1_DATABASE_ID=""
```

Finally, run:

```
pnpm test.d1
```

### libSQL

```
pnpm test.libsql
```
