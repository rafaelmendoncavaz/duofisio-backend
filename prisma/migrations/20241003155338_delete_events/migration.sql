-- DropForeignKey
ALTER TABLE "appointments" DROP CONSTRAINT "appointments_patientId_fkey";

-- DropForeignKey
ALTER TABLE "clinical_data" DROP CONSTRAINT "clinical_data_patientId_fkey";

-- DropForeignKey
ALTER TABLE "patient" DROP CONSTRAINT "patient_addressId_fkey";

-- AddForeignKey
ALTER TABLE "patient" ADD CONSTRAINT "patient_addressId_fkey" FOREIGN KEY ("addressId") REFERENCES "address"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "clinical_data" ADD CONSTRAINT "clinical_data_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "patient"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "appointments" ADD CONSTRAINT "appointments_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "patient"("id") ON DELETE CASCADE ON UPDATE CASCADE;
