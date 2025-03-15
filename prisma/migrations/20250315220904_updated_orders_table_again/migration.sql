-- AlterTable
ALTER TABLE "orders" ADD COLUMN     "carrier" TEXT,
ADD COLUMN     "shippedAt" TIMESTAMP(3),
ALTER COLUMN "cancellationReason" DROP NOT NULL,
ALTER COLUMN "deliveredAt" DROP NOT NULL,
ALTER COLUMN "trackingNumber" DROP NOT NULL,
ALTER COLUMN "trackingNumber" SET DATA TYPE TEXT;
