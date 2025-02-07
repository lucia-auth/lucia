# `@lifeworld/adapter-sqlite`

SQLite adapter for Lucia.

**[Documentation](https://v3.lucia-auth.com/database/sqlite)**

**[Lucia documentation](https://v3.lucia-auth.com)**

**[Changelog](https://github.com/1ifeworld/lucia/blob/main/packages/adapter-sqlite/CHANGELOG.md)**

## Supported drivers

-   [`better-sqlite3`](https://github.com/WiseLibs/better-sqlite3)
-   [`bun:sqlite`](https://bun.sh/docs/api/sqlite)
-   [Cloudflare D1](https://developers.cloudflare.com/d1/)
-   [libSQL](https://github.com/libsql/libsql) (Turso)

## Installation

```
npm install @lifeworld/adapter-sqlite
pnpm add @lifeworld/adapter-sqlite
yarn add @lifeworld/adapter-sqlite
```

## Testing

### `better-sqlite3`

```
pnpm test.better-sqlite3
```

### Bun SQLite

```
pnpm test.bun-sqlite
```

### Cloudflare D1

```
pnpm test.d1
```

### libSQL

```
pnpm test.libsql
```
