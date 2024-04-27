---
title: "Upgrade your MySQL database to v3"
---

# Upgrade your MySQL database to v3

**Migration must be handled manually or else you will lose all your data**. **Do NOT use automated tools as is.** Read this guide carefully as some parts depend on your current structure (**especially the table names**), and feel free to ask questions on our Discord server if you have any questions.

## Update the adapter

Install the latest version of the MySQL adapter package.

```
npm install @lucia-auth/adapter-mysql
```

Initialize the adapter:

```ts
import { Mysql2Adapter, PlanetScaleAdapter } from "@lucia-auth/adapter-mysql";

new Mysql2Adapter(pool, {
	// table names
	user: "user",
	session: "user_session"
});

new PlanetScaleAdapter(connection, {
	// table names
	user: "user",
	session: "user_session"
});
```

## Update session table

The main change to the session table is that the `idle_expires` and `active_expires` columns are replaced with a single `expires_at` column. Unlike the previous columns, it's a `DATETIME` column.

**Check your table names before running the code.**

```sql
ALTER TABLE user_session ADD expires_at DATETIME;

UPDATE user_session SET expires_at = FROM_UNIXTIME(idle_expires / 1000);

ALTER TABLE user_session DROP active_expires, DROP idle_expires, MODIFY expires_at DATETIME NOT NULL;
```

You may also just delete the session table and replace it with the [new schema](/database/mysql#schema).

## Replace key table

You can keep using the key table, but we recommend using dedicated tables for each authentication method.

### OAuth

The SQL below creates a dedicated table `oauth_account` for storing all user OAuth accounts. This assumes all keys where `hashed_password` column is null are for OAuth accounts. You may also separate them by the OAuth provider. You should adjust the `VARCHAR` length accordingly.

```sql
CREATE TABLE oauth_account (
    provider_id VARCHAR(255) NOT NULL,
    provider_user_id VARCHAR(255) NOT NULL,
    user_id VARCHAR(255) NOT NULL REFERENCES user(id),
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
    id INT PRIMARY KEY AUTO_INCREMENT,
    hashed_password VARCHAR(255) NOT NULL,
    user_id VARCHAR(255) NOT NULL REFERENCES user(id)
);

INSERT INTO password (hashed_password, user_id)
SELECT hashed_password, user_id FROM user_key
WHERE SUBSTRING(id, 1, POSITION(':' IN id)-1) = 'email';
```

Alternatively, you can store the user's credentials in the user table if you only work with email/password.

```sql
ALTER TABLE user ADD hashed_password VARCHAR(255);

UPDATE user INNER JOIN user_key ON user_key.user_id = user.id
SET user.hashed_password = user_key.hashed_password
WHERE user_key.hashed_password IS NOT NULL;

ALTER TABLE user MODIFY hashed_password VARCHAR(255) NOT NULL;
```
