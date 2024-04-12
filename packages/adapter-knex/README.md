# `@lucia-auth/adapter-knex`

[Knex.js](https://knexjs.org/) adapter for Lucia.

**[Documentation]()**

**[Lucia documentation](https://v3.lucia-auth.com)**

**[Changelog](https://github.com/shig07770/lucia/tree/adapter-knex/packages/adapter-knex)**

## Installation

```
npm install @lucia-auth/adapter-knex
pnpm add @lucia-auth/adapter-knex
yarn add @lucia-auth/adapter-knex
```

## Testing
To test for PostgreSQL, add `POSTGRES_DATABASE`/`POSTGRES_PASSWORD` to your environment and run:
```
pnpm run test.postgresql
```

To test for MySQL/MySQL2, add `MYSQL_DATABASE`/`MYSQL_PASSWORD` to your environment and run:
```
pnpm run test.mysql
pnpm run test.mysql2
```

To test for SQLite3/Better SQLite3, run:
```
pnpm run test.sqlite3
pnpm run test.better-sqlite3
```
