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
| 0.2.x                  | 0.4.x ~       |

## Testing

### PostgreSQL

```
pnpm test-psql-main
```

```shell
PSQL_DATABASE_URL="" # database url
```

### MySQL

```
pnpm test-mysql-main
```

```shell
MYSQL_DATABASE="" # database name
MYSQL_PASSWORD="" # user password
```

```sql
CREATE TABLE user (
    id VARCHAR(36) NOT NULL,
    provider_id VARCHAR(255) NOT NULL UNIQUE,
    hashed_password VARCHAR(255),
    username VARCHAR(31) NOT NULL UNIQUE,
    PRIMARY KEY (id)
);

CREATE TABLE session (
    id VARCHAR(127) NOT NULL,
    user_id VARCHAR(36) NOT NULL,
    expires BIGINT UNSIGNED NOT NULL,
    idle_expires BIGINT UNSIGNED NOT NULL,
    PRIMARY KEY (id),
    FOREIGN KEY (user_id) REFERENCES user(id)
);
```

### SQLITE

```
pnpm test-sqlite-main
```

```sql
CREATE TABLE main.user (
    id VARCHAR(31) NOT NULL,
    provider_id VARCHAR(255) NOT NULL UNIQUE,
    hashed_password VARCHAR(255),
    username VARCHAR(31) NOT NULL UNIQUE,
    PRIMARY KEY (id)
);

CREATE TABLE main.session (
    id VARCHAR(127) NOT NULL,
    user_id VARCHAR(36) NOT NULL,
    expires BIGINT UNSIGNED NOT NULL,
    idle_expires BIGINT UNSIGNED NOT NULL,
    PRIMARY KEY (id),
    FOREIGN KEY (user_id) REFERENCES user(id)
);
```
