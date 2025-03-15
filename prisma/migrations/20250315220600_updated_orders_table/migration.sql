/*
  Warnings:

  - Added the required column `cancellationReason` to the `orders` table without a default value. This is not possible if the table is not empty.
  - Added the required column `deliveredAt` to the `orders` table without a default value. This is not possible if the table is not empty.
  - Added the required column `trackingNumber` to the `orders` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "orders" ADD COLUMN     "cancellationReason" TEXT NOT NULL,
ADD COLUMN     "deliveredAt" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "trackingNumber" INTEGER NOT NULL;
