-- AlterTable
ALTER TABLE "comments" ADD COLUMN     "authorEmail" TEXT,
ADD COLUMN     "authorName" TEXT,
ALTER COLUMN "userId" DROP NOT NULL;
