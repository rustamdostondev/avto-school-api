-- AlterTable
ALTER TABLE "users" ADD COLUMN     "access_end_at" TIMESTAMPTZ,
ADD COLUMN     "access_start_at" TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP;
