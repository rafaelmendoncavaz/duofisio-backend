/*
  Warnings:

  - You are about to drop the column `appointmentDate` on the `appointments` table. All the data in the column will be lost.
  - You are about to drop the column `duration` on the `appointments` table. All the data in the column will be lost.
  - You are about to drop the column `sessionNumber` on the `appointments` table. All the data in the column will be lost.
  - You are about to drop the column `status` on the `appointments` table. All the data in the column will be lost.
  - Added the required column `totalSessions` to the `appointments` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "appointments" DROP COLUMN "appointmentDate",
DROP COLUMN "duration",
DROP COLUMN "sessionNumber",
DROP COLUMN "status",
ADD COLUMN     "totalSessions" INTEGER NOT NULL;

-- CreateTable
CREATE TABLE "sessions" (
    "id" TEXT NOT NULL,
    "status" "AppointmentStatus" NOT NULL,
    "appointmentDate" TIMESTAMP(3) NOT NULL,
    "duration" INTEGER NOT NULL,
    "sessionNumber" INTEGER NOT NULL,
    "progress" TEXT,
    "appointmentId" TEXT NOT NULL,

    CONSTRAINT "sessions_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_appointmentId_fkey" FOREIGN KEY ("appointmentId") REFERENCES "appointments"("id") ON DELETE CASCADE ON UPDATE CASCADE;
