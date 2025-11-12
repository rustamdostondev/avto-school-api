/*
  Warnings:

  - You are about to drop the `exam_results` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `exam_sessions` table. If the table is not empty, all the data it contains will be lost.

*/
-- CreateEnum
CREATE TYPE "ExamType" AS ENUM ('SUBJECT', 'TICKET', 'RANDOM');

-- DropForeignKey
ALTER TABLE "public"."exam_results" DROP CONSTRAINT "exam_results_session_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."exam_results" DROP CONSTRAINT "exam_results_subject_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."exam_results" DROP CONSTRAINT "exam_results_user_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."exam_sessions" DROP CONSTRAINT "exam_sessions_subject_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."exam_sessions" DROP CONSTRAINT "exam_sessions_user_id_fkey";

-- DropTable
DROP TABLE "public"."exam_results";

-- DropTable
DROP TABLE "public"."exam_sessions";

-- CreateTable
CREATE TABLE "exams" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "subject_id" UUID,
    "ticket_id" UUID,
    "started_at" TIMESTAMPTZ NOT NULL,
    "ended_at" TIMESTAMPTZ,
    "time_limit" INTEGER NOT NULL DEFAULT 60,
    "type" "ExamType" NOT NULL DEFAULT 'RANDOM',
    "status" VARCHAR(20) NOT NULL DEFAULT 'active',
    "question_ids" TEXT[],
    "correct_questions_ids" TEXT[],
    "question_count" INTEGER NOT NULL DEFAULT 20,
    "correct_question_count" INTEGER NOT NULL DEFAULT 20,
    "is_deleted" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deleted_at" TIMESTAMPTZ,
    "deleted_by" UUID,
    "created_by" UUID,
    "updated_by" UUID,

    CONSTRAINT "exams_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "exams" ADD CONSTRAINT "exams_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "exams" ADD CONSTRAINT "exams_subject_id_fkey" FOREIGN KEY ("subject_id") REFERENCES "subjects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "exams" ADD CONSTRAINT "exams_ticket_id_fkey" FOREIGN KEY ("ticket_id") REFERENCES "tickets"("id") ON DELETE CASCADE ON UPDATE CASCADE;
