# `@lucia-auth/adapter-kysely`

[Kysely](https://github.com/koskimas/kysely) adapter for Lucia

**[Documentation](https://lucia-auth.vercel.app/learn/adapters/kysely)**

**[Lucia documentation](https://lucia-auth.vercel.app)**

**[Changelog](https://github.com/pilcrowOnPaper/lucia-auth/blob/main/packages/adapter-kysely/CHANGELOG.md)**

## Installation

```
npm install @lucia-auth/adapter-kysely
```

## Lucia version compatibility

| Kysely adapter version | Lucia version |
| ---------------------- | ------------- |
| 0.1.x                  | 0.1.x ~ 0.2.x |
| 0.2.x, 0.3.x           | 0.4.x         |
| 0.4.x                  | 0.5.x         |
| 0.5.x                  | 0.6.x         |

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
