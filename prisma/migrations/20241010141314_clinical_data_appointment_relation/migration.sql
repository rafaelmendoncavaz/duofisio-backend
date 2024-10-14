/*
  Warnings:

  - A unique constraint covering the columns `[appointmentReasonId]` on the table `appointments` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `appointmentReasonId` to the `appointments` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "appointments" ADD COLUMN     "appointmentReasonId" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "appointments_appointmentReasonId_key" ON "appointments"("appointmentReasonId");

-- AddForeignKey
ALTER TABLE "appointments" ADD CONSTRAINT "appointments_appointmentReasonId_fkey" FOREIGN KEY ("appointmentReasonId") REFERENCES "clinical_data"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
