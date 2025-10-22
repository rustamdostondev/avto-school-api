/*
  Warnings:

  - You are about to drop the column `isCorrect` on the `answers` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "answers" DROP COLUMN "isCorrect",
ADD COLUMN     "is_correct" BOOLEAN NOT NULL DEFAULT false;
