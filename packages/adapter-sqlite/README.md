# `@lucia-auth/adapter-sqlite`

SQLite adapter for Lucia

**[Documentation](https://lucia-auth.com/database/sqlite)**

**[Lucia documentation](https://lucia-auth.com)**

**[Changelog](https://github.com/pilcrowOnPaper/lucia/blob/main/packages/adapter-sqlite/CHANGELOG.md)**

## Supported drivers

- [`better-sqlite3`](https://github.com/WiseLibs/better-sqlite3)

## Installation

```
npm install @lucia-auth/adapter-sqlite
pnpm add @lucia-auth/adapter-sqlite
yarn add @lucia-auth/adapter-sqlite
```

## Version compatibility

| `@lucia-auth/adapter-sqlite` | `lucia-auth` | `better-sqlite3` |
| ---------------------------- | ------------ | ---------------- |
| `^1.0.0`                     | `^1.4.0`     | `^8.0.0`         |

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
