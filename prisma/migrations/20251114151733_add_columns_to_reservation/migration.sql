-- AlterTable
ALTER TABLE "public"."Reservation" ADD COLUMN     "address" TEXT,
ADD COLUMN     "extra" JSONB,
ADD COLUMN     "phoneNumber" TEXT,
ADD COLUMN     "postcode" TEXT,
ADD COLUMN     "reservationDate" TIMESTAMP(3),
ADD COLUMN     "setupTime" TEXT,
ADD COLUMN     "suburb" TEXT,
ADD COLUMN     "userId" TEXT;
