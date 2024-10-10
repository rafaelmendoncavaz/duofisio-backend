-- DropForeignKey
ALTER TABLE "adult_responsible" DROP CONSTRAINT "adult_responsible_addressId_fkey";

-- AddForeignKey
ALTER TABLE "adult_responsible" ADD CONSTRAINT "adult_responsible_addressId_fkey" FOREIGN KEY ("addressId") REFERENCES "address"("id") ON DELETE CASCADE ON UPDATE CASCADE;
