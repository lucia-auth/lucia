---
title: "Upgrade your SQLite database to v3"
---

# Upgrade your SQLite database to v3

**Migration must be handled manually or else you will lose all your data**. **Do NOT use automated tools as is.** Read this guide carefully as some parts depend on your current structure (**especially the table names**), and feel free to ask questions on our Discord server if you have any questions.

## Update the adapter

Install the latest version of the SQLite adapter package.

```
npm install @lucia-auth/adapter-sqlite
```

Initialize the adapter:

```ts
import {
	BetterSqlite3Adapter,
	CloudflareD1Adapter,
	LibSQLAdapter
} from "@lucia-auth/adapter-sqlite";

new BetterSqlite3Adapter(db, {
	// table names
	user: "user",
	session: "session"
});

new CloudflareD1Adapter(d1, {
	// table names
	user: "user",
	session: "session"
});

new LibSQLAdapter(db, {
	// table names
	user: "user",
	session: "session"
});
```

## Update session table

The main change to the session table is that the `idle_expires` and `active_expires` columns are replaced with a single `expires_at` column. Unlike the previous columns, this takes a UNIX time in _seconds_.

Make sure to use transactions and add any additional columns in your existing session table when creating the new table and copying the data.

**Check your table names before running the code.**

```sql
BEGIN TRANSACTION;

CREATE TABLE new_session (
    id TEXT NOT NULL PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES user(id),
    expires_at INTEGER NOT NULL
);

INSERT INTO new_session (id, user_id, expires_at)
SELECT id, user_id, idle_expires / 1000 FROM session;

DROP TABLE session;

ALTER TABLE new_session RENAME TO session;
```

Check your new `session` table looks right. If not run `ROLLBACK` to rollback the transaction. If you're ready, run `COMMIT` to commit the transaction:

```sql
COMMIT;
```

You may also just delete the session table and replace it with the [new schema](/database/sqlite#schema).

## Replace key table

You can keep using the key table, but we recommend using dedicated tables for each authentication method.

### OAuth

The SQL below creates a dedicated table `oauth_account` for storing all user OAuth accounts. This assumes all keys where `hashed_password` column is null are for OAuth accounts. You may also separate them by the OAuth provider.

```sql
CREATE TABLE oauth_account (
    provider_id TEXT NOT NULL,
    provider_user_id TEXT NOT NULL,
    user_id TEXT NOT NULL REFERENCES user(id),
    PRIMARY KEY (provider_id, provider_user_id)
);

INSERT INTO oauth_account (provider_id, provider_user_id, user_id)
SELECT substr(id, 1, instr(id, ':')-1), substr(id, instr(id, ':')+1), user_id FROM key
WHERE hashed_password IS NULL;
```

### Email/password

The SQL below creates a dedicated table `password` for storing user passwords. This assumes the provider ID for emails was `email` and that you're already storing the users' emails in the user table.

```sql
CREATE TABLE password (
    hashed_password TEXT NOT NULL,
    user_id TEXT NOT NULL REFERENCES user(id)
);

INSERT INTO password (hashed_password, user_id)
SELECT hashed_password, user_id FROM key
WHERE substr(id, 1, instr(id, ':')-1) = 'email';
```

Alternatively, you can store the user's credentials in the user table if you only work with email/password. Unfortunately, since SQLite's `ALTER` statement only supports a limited number of operations, you'd have to recreate tables that reference the user table.

```sql
BEGIN TRANSACTION;

CREATE TABLE new_user (
    id TEXT NOT NULL PRIMARY KEY,
    email TEXT NOT NULL UNIQUE,
    hashed_password TEXT NOT NULL
);

INSERT INTO new_user (id, email, hashed_password)
SELECT user.id, email, hashed_password FROM user INNER JOIN key ON key.user_id = user.id
WHERE hashed_password IS NOT NULL;

CREATE TABLE new_session (
    id TEXT NOT NULL PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES user(id),
    expires_at INTEGER NOT NULL
);

INSERT INTO new_session (id, user_id, expires_at)
SELECT id, user_id, expires_at FROM session;

DROP TABLE session;
DROP TABLE user;

ALTER TABLE new_user RENAME TO user;
ALTER TABLE new_session RENAME TO session;

COMMIT;
```
