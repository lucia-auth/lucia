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
| 0.2.x, 0.3.x           | 0.4.x ~       |

## Testing

Follow the documentation on database set up.

### PostgreSQL

Since it's easier to just recreate the table than changing column type for `public.user(id)`, drop all tables:

```sql
DROP TABLE public.key;
DROP TABLE public.session;
DROP TABLE public.user;
```

And set it up again:

```sql
BEGIN;
CREATE TABLE public.user (
	id TEXT PRIMARY KEY,
    username TEXT UNIQUE NOT NULL
);

CREATE TABLE public.session (
  	id TEXT PRIMARY KEY,
	user_id TEXT REFERENCES public.user(id) NOT NULL,
	active_expires BIGINT NOT NULL,
	idle_expires BIGINT NOT NULL
);

CREATE TABLE public.key (
  	id TEXT PRIMARY KEY,
	user_id TEXT REFERENCES public.user(id) NOT NULL,
	"primary" BOOLEAN NOT NULL,
    hashed_password TEXT
);
COMMIT;
```

```
pnpm test-psql-main
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
