---
title: "Upgrade Prisma and your PostgreSQL database to v3"
---

# Upgrade Prisma and your PostgreSQL database to v3

The v3 Prisma adapter now requires all fields to be `camelCase`.

**Migration must be handled manually or else you will lose all your data**. **Do NOT use Prisma's migration tools as is**. Read this guide carefully as some parts depend on your current structure (**especially the table names**), and feel free to ask questions on our Discord server if you have any questions.

## Update session table

The main change to the session table is that the `idle_expires` and `active_expires` fields are replaced with a single `expiresAt` field. Unlike the previous columns, it's a `DateTime` type. Update the `Session` model. Make sure to add any custom attributes you previously had.

```prisma
model Session {
    id        String   @id
    userId    String
    expiresAt DateTime
    user      User     @relation(references: [id], fields: [userId], onDelete: Cascade)
}
```

If you're fine with clearing your session table, you can now migrate your database and you're done updating it.

However, if you'd like to keep your session data, first run `prisma migrate` **with the `--create-only` flag.**

```
npx prisma migrate dev --name updated_session --create-only
```

Find the migration file inside `prisma/migrations/X_updated_session` and replace it with the SQL below. Make sure to alter it if you have custom session attributes.

**This script assumes your session and user models are named `Session` and `User`.**

```sql
ALTER TABLE "Session"
DROP CONSTRAINT "Session_user_id_fkey",
ADD COLUMN "expiresAt" TIMESTAMP(3);

UPDATE "Session" SET "expiresAt" = to_timestamp("idle_expires" / 1000);

ALTER TABLE "Session" RENAME COLUMN "user_id" TO "userId";

ALTER TABLE "Session"
DROP COLUMN "active_expires",
DROP COLUMN "idle_expires",
ALTER COLUMN "expiresAt" SET NOT NULL,
ADD CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
```

Finally, run the migration:

```
npx prisma migrate dev --name updated_session
```

## Replace key table

You can keep using the key table, but we recommend using dedicated tables for each authentication method.

### OAuth

This creates a dedicated model for user OAuth accounts.

```prisma
model User {
    id            String         @id
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
INSERT INTO "OauthAccount" ("providerId", "providerUserId", "userId")
SELECT SUBSTRING("id", 1, POSITION(':' IN "id")-1), SUBSTRING("id", POSITION(':' IN id)+1), "user_id" FROM "Key"
WHERE "hashed_password" IS NULL;
```

### Email/password

This creates a dedicated model for user passwords.

```prisma
model User {
    id         String     @id
    sessions   Session[]
    passwords  Password[]
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

Finally, copy the data from the key table. This assumes the provider ID for emails was `email` and that you're already storing the users' emails in the user table.

```sql
INSERT INTO "Password" ("hashedPassword", "userId")
SELECT "hashed_password", "user_id" FROM "Key"
WHERE SUBSTRING("id", 1, POSITION(':' IN "id")-1) = 'email';
```
