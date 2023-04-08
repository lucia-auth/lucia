/*
  Warnings:

  - You are about to drop the `Email` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "Email";
PRAGMA foreign_keys=on;

-- CreateTable
CREATE TABLE "email" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "subject" TEXT NOT NULL,
    "email_address" TEXT NOT NULL,
    "date_sent" DATETIME NOT NULL,
    "content" TEXT NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "email_id_key" ON "email"("id");
