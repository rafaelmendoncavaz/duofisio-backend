/*
  Warnings:

  - You are about to drop the column `appointmentReasonId` on the `appointments` table. All the data in the column will be lost.
  - Added the required column `clinicalRecordId` to the `appointments` table without a default value. This is not possible if the table is not empty.
  - Added the required column `duration` to the `appointments` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "appointments" DROP CONSTRAINT "appointments_appointmentReasonId_fkey";

-- DropIndex
DROP INDEX "appointments_appointmentReasonId_key";

-- AlterTable
ALTER TABLE "appointments" DROP COLUMN "appointmentReasonId",
ADD COLUMN     "clinicalRecordId" TEXT NOT NULL,
ADD COLUMN     "duration" INTEGER NOT NULL;

-- AddForeignKey
ALTER TABLE "appointments" ADD CONSTRAINT "appointments_clinicalRecordId_fkey" FOREIGN KEY ("clinicalRecordId") REFERENCES "clinical_data"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
