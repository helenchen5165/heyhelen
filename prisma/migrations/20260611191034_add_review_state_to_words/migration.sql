-- AlterTable
ALTER TABLE "words" ADD COLUMN     "lastReviewedAt" TIMESTAMP(3),
ADD COLUMN     "reviewState" TEXT NOT NULL DEFAULT 'unseen';
