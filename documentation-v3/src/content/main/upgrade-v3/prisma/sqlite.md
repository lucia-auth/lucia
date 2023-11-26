---
title: "Upgrade Prisma and your SQLite database to v3"
---

The v3 Prisma adapter now requires all fields to be `camelCase`.

## Update session table

The main changes to the session table is that `idle_expires` and `active_expires` fields are replaced with a single `expiresAt` field. Unlike the previous columns, it's a `DateTime` type.

Make sure to use transactions and add any additional columns in your existing session table when creating the new table and copying the data.

```sql
BEGIN TRANSACTION;

CREATE TABLE NewSession (
    id TEXT NOT NULL PRIMARY KEY,
    userId TEXT NOT NULL REFERENCES user(id),
    expiresAt INTEGER NOT NULL
);

INSERT INTO NewSession (id, userId, expiresAt)
SELECT id, user_id, idle_expires / 1000 FROM Session;

DROP TABLE Session;

ALTER TABLE NewSession RENAME TO Session;
```

Check your new `session` table looks right. If not run `ROLLBACK` to rollback the transaction. If you're ready, commit the transaction:

```sql
COMMIT;
```

Next add a `Session` model.

```prisma
model Session {
    id        String   @id @unique
    userId    String
    expiresAt DateTime
    user      User     @relation(references: [id], fields: [userId], onDelete: Cascade)
}
```

Finally, generate the Prisma client types (**Do not use `migrate`**):

```
npx prisma generate
```

## Replace key table

You can keep using the key table, but we recommend using dedicated tables for each authentication method.

### OAuth

This creates a dedicated model for storing all user OAuth accounts.

```prisma
model User {
    id            String         @id @unique
    sessions      Session[]
    oauthAccounts OauthAccount[]
}

model OauthAccount {
    providerId     String
    providerUserId String
    userId         String
    user           User   @relation(references: [id], fields: [userId], onDelete: Cascade)

    @@id([providerId, providerUserId])
}
```

Update your database:

```
npx prisma migrate dev --name added_oauth_account_table
```

Finally, copy the data from the key table. This assumes all keys where `hashed_password` column is null are for OAuth accounts.

```sql
INSERT INTO oauth_account (providerId, providerUserId, user_id)
SELECT substr(id, 1, instr(id, ':')-1), substr(id, instr(id, ':')+1), user_id FROM key
WHERE hashed_password IS NULL;
```

### Email/password

This creates a dedicated model for storing passwords.

```prisma
model User {
    id        String         @id @unique
    sessions  Session[]
    passwords OauthAccount[]
}

model Password {
    id             Int    @id @default(autoincrement())
    hashedPassword String
    userId         String
    user           User   @relation(references: [id], fields: [userId], onDelete: Cascade)
}
```

Update your database:

```
npx prisma migrate dev --name added_password_table
```

Finally, copy the data from the key table. This assumes the provider id for emails was `email` and that you're already storing the users' emails in the user table.

```sql
INSERT INTO password (hashed_password, user_id)
SELECT hashed_password, user_id FROM key
WHERE substr(id, 1, instr(id, ':')-1) = 'email';
```
