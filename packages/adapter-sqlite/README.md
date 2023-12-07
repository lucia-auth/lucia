# `@lucia-auth/adapter-sqlite`

SQLite adapter for Lucia v3.

**[Documentation](https://lucia-auth.com/reference#lucia-authadapter-prisma)**

**[Lucia documentation](https://v3.lucia-auth.com)**

**[Changelog](https://github.com/pilcrowOnPaper/lucia/blob/main/packages/adapter-sqlite/CHANGELOG.md)**

## Supported drivers

- [`better-sqlite3`](https://github.com/WiseLibs/better-sqlite3)
- [`bun:sqlite`](https://bun.sh/docs/api/sqlite)
- [Cloudflare D1](https://developers.cloudflare.com/d1/)
- [libSQL](https://github.com/libsql/libsql) (Turso)

## Installation

```
npm install @lucia-auth/adapter-sqlite@beta
pnpm add @lucia-auth/adapter-sqlite@beta
yarn add @lucia-auth/adapter-sqlite@beta
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
