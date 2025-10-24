/*
  Warnings:

  - You are about to drop the `ReservationItem` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "public"."ReservationItem" DROP CONSTRAINT "ReservationItem_itemId_fkey";

-- DropForeignKey
ALTER TABLE "public"."ReservationItem" DROP CONSTRAINT "ReservationItem_reservationId_fkey";

-- AlterTable
ALTER TABLE "public"."Reservation" ADD COLUMN     "items" JSONB,
ADD COLUMN     "optionalItems" JSONB;

-- DropTable
DROP TABLE "public"."ReservationItem";
