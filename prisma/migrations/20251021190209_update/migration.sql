/*
  Warnings:

  - You are about to drop the column `correctAnswerIndex` on the `questions` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "questions" DROP COLUMN "correctAnswerIndex",
ADD COLUMN     "correct_answer_index" INTEGER NOT NULL DEFAULT 2;
