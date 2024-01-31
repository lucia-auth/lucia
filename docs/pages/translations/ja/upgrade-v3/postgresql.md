---
title: "Upgrade your PostgreSQL database to v3"
---

# Upgrade your PostgreSQL database to v3

**Migration must be handled manually or else you will lose all your data**. **Do NOT use automated tools as is.** Read this guide carefully as some parts depend on your current structure (**especially the table names**), and feel free to ask questions on our Discord server if you have any questions.

## Update the adapter

Install the latest version of the PostgreSQL adapter package.

```
npm install @lucia-auth/adapter-postgresql
```

Initialize the adapter:

```ts
import { NodePostgresAdapter, PostgresJsAdapter } from "@lucia-auth/adapter-postgresql";

// previously named `pg` adapter
new NodePostgresAdapter(pool, {
	// table names
	user: "auth_user",
	session: "user_session"
});

// previously named `postgres` adapter
new PostgresJsAdapter(sql, {
	// table names
	user: "auth_user",
	session: "user_session"
});
```

## Update session table

The main change to the session table is that the `idle_expires` and `active_expires` columns are replaced with a single `expires_at` column. Unlike the previous columns, it's a `DATETIME` column.

**Check your table names before running the code.**

```sql
START TRANSACTION;

ALTER TABLE user_session ADD COLUMN expires_at TIMESTAMPTZ;

UPDATE user_session SET expires_at = to_timestamp(idle_expires / 1000);

ALTER TABLE user_session
DROP COLUMN active_expires,
DROP COLUMN idle_expires,
ALTER COLUMN expires_at SET NOT NULL;
```

Do a final check and commit the transaction.

```sql
COMMIT;
```

You may also just delete the session table and replace it with the [new schema](/database/postgresql#schema).

## Replace key table

You can keep using the key table, but we recommend using dedicated tables for each authentication method.

### OAuth

The SQL below creates a dedicated table `oauth_account` for storing all user OAuth accounts. This assumes all keys where `hashed_password` column is null are for OAuth accounts. You may also separate them by the OAuth provider.

```sql
CREATE TABLE oauth_account (
    provider_id TEXT NOT NULL,
    provider_user_id TEXT NOT NULL,
    user_id TEXT NOT NULL REFERENCES auth_user(id),
    PRIMARY KEY (provider_id, provider_user_id)
);

INSERT INTO oauth_account (provider_id, provider_user_id, user_id)
SELECT SUBSTRING(id, 1, POSITION(':' IN id)-1), SUBSTRING(id, POSITION(':' IN id)+1), user_id FROM user_key
WHERE hashed_password IS NULL;
```

### Email/password

The SQL below creates a dedicated table `password` for storing user passwords. This assumes the provider ID for emails was `email` and that you're already storing the users' emails in the user table.

```sql
CREATE TABLE password (
    id SERIAL PRIMARY KEY,
    hashed_password TEXT NOT NULL,
    user_id TEXT NOT NULL REFERENCES auth_user(id)
);

INSERT INTO password (hashed_password, user_id)
SELECT hashed_password, user_id FROM user_key
WHERE SUBSTRING(id, 1, POSITION(':' IN id)-1) = 'email';
```

Alternatively, you can store the user's credentials in the user table if you only work with email/password.

```sql
START TRANSACTION;

ALTER TABLE auth_user ADD COLUMN hashed_password TEXT;

UPDATE auth_user SET hashed_password = user_key.hashed_password FROM user_key
WHERE user_key.user_id = auth_user.id
AND user_key.hashed_password IS NOT NULL;

ALTER TABLE auth_user ALTER COLUMN hashed_password SET NOT NULL;

COMMIT;
```
