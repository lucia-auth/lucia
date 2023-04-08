/*
  Warnings:

  - Added the required column `subject` to the `Email` table without a default value. This is not possible if the table is not empty.

*/
-- RedefineTables
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Email" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "subject" TEXT NOT NULL,
    "email_address" TEXT NOT NULL,
    "date_sent" DATETIME NOT NULL,
    "content" TEXT NOT NULL
);
INSERT INTO "new_Email" ("content", "date_sent", "email_address", "id") SELECT "content", "date_sent", "email_address", "id" FROM "Email";
DROP TABLE "Email";
ALTER TABLE "new_Email" RENAME TO "Email";
CREATE UNIQUE INDEX "Email_id_key" ON "Email"("id");
PRAGMA foreign_key_check;
PRAGMA foreign_keys=ON;
