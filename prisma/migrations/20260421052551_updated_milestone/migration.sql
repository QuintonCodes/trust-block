-- CreateEnum
CREATE TYPE "SubmissionType" AS ENUM ('LINK', 'FILE');

-- AlterTable
ALTER TABLE "milestones" ADD COLUMN     "submission_type" "SubmissionType",
ADD COLUMN     "submission_url" TEXT;
