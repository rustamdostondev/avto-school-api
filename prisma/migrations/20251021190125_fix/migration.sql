/*
  Warnings:

  - You are about to drop the column `isDeleted` on the `answers` table. All the data in the column will be lost.
  - You are about to drop the column `isDeleted` on the `questions` table. All the data in the column will be lost.
  - You are about to drop the column `isDeleted` on the `subjects` table. All the data in the column will be lost.
  - You are about to drop the column `isDeleted` on the `tickets` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "answers" DROP COLUMN "isDeleted",
ADD COLUMN     "is_deleted" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "questions" DROP COLUMN "isDeleted",
ADD COLUMN     "is_deleted" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "subjects" DROP COLUMN "isDeleted",
ADD COLUMN     "is_deleted" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "tickets" DROP COLUMN "isDeleted",
ADD COLUMN     "is_deleted" BOOLEAN NOT NULL DEFAULT false;
