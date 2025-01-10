/*
  Warnings:

  - Added the required column `s3Url` to the `File` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "File" ADD COLUMN     "s3Url" TEXT NOT NULL;
