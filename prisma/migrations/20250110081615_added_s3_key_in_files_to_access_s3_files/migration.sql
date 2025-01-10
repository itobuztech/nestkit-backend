/*
  Warnings:

  - Added the required column `s3Key` to the `File` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "File" ADD COLUMN     "s3Key" TEXT NOT NULL,
ALTER COLUMN "s3Url" DROP NOT NULL;
