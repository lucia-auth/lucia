# `@lucia-auth/adapter-kysely`

[Kysely](https://github.com/koskimas/kysely) adapter for Lucia

**[Documentation](https://lucia-auth.com/learn/adapters/kysely)**

**[Lucia documentation](https://lucia-auth.com)**

**[Changelog](https://github.com/pilcrowOnPaper/lucia/blob/main/packages/adapter-kysely/CHANGELOG.md)**

## Installation

```
npm install @lucia-auth/adapter-kysely
```

Requires `lucia-auth@0.11.0`.

## Testing

First follow the documentation on database set up.

### PostgreSQL

Add `username` column:

```sql
ALTER TABLE public.user
ADD COLUMN username TEXT NOT NULL UNIQUE;
```

```
pnpm test-psql
```

```shell
PSQL_DATABASE_URL="" # database url
```

### MySQL

Add `username` column:

```sql
ALTER TABLE user
ADD COLUMN username VARCHAR(31) NOT NULL UNIQUE AFTER id;
```

```shell
MYSQL_DATABASE="" # database name
MYSQ_PASSWORD="" # password
```

```
pnpm test-mysql-main
```

### SQLITE

Add `username` column:

```sql
ALTER TABLE user ADD COLUMN username VARCHAR(31) NOT NULL;
CREATE UNIQUE INDEX username ON user(username);
```

```
pnpm test-sqlite-main
```
