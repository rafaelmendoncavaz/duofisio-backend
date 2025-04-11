/*
  Warnings:

  - Added the required column `sessionNumber` to the `appointments` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "appointments" ADD COLUMN     "sessionNumber" INTEGER NOT NULL;
