/*
  Warnings:

  - The values [MATCHED,REJECTED] on the enum `MatchStatus` will be removed. If these variants are still used in the database, this will fail.
  - You are about to drop the column `fromUserId` on the `matches` table. All the data in the column will be lost.
  - You are about to drop the column `toUserId` on the `matches` table. All the data in the column will be lost.
  - You are about to drop the column `ageMax` on the `preferences` table. All the data in the column will be lost.
  - You are about to drop the column `ageMin` on the `preferences` table. All the data in the column will be lost.
  - You are about to drop the column `distance` on the `preferences` table. All the data in the column will be lost.
  - You are about to drop the column `interestedIn` on the `preferences` table. All the data in the column will be lost.
  - You are about to drop the column `city` on the `profiles` table. All the data in the column will be lost.
  - You are about to drop the column `country` on the `profiles` table. All the data in the column will be lost.
  - You are about to drop the column `lastLocationUpdate` on the `profiles` table. All the data in the column will be lost.
  - You are about to drop the column `latitude` on the `profiles` table. All the data in the column will be lost.
  - You are about to drop the column `longitude` on the `profiles` table. All the data in the column will be lost.
  - You are about to drop the column `state` on the `profiles` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[userId,productId]` on the table `matches` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `productId` to the `matches` table without a default value. This is not possible if the table is not empty.
  - Added the required column `userId` to the `matches` table without a default value. This is not possible if the table is not empty.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "MatchStatus_new" AS ENUM ('PENDING', 'LIKED', 'DISLIKED', 'ADDED_TO_CART');
ALTER TABLE "matches" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "matches" ALTER COLUMN "status" TYPE "MatchStatus_new" USING ("status"::text::"MatchStatus_new");
ALTER TYPE "MatchStatus" RENAME TO "MatchStatus_old";
ALTER TYPE "MatchStatus_new" RENAME TO "MatchStatus";
DROP TYPE "MatchStatus_old";
ALTER TABLE "matches" ALTER COLUMN "status" SET DEFAULT 'PENDING';
COMMIT;

-- DropForeignKey
ALTER TABLE "matches" DROP CONSTRAINT "matches_fromUserId_fkey";

-- DropForeignKey
ALTER TABLE "matches" DROP CONSTRAINT "matches_toUserId_fkey";

-- DropIndex
DROP INDEX "matches_fromUserId_toUserId_key";

-- DropIndex
DROP INDEX "profiles_latitude_longitude_idx";

-- AlterTable
ALTER TABLE "matches" DROP COLUMN "fromUserId",
DROP COLUMN "toUserId",
ADD COLUMN     "productId" TEXT NOT NULL,
ADD COLUMN     "userId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "preferences" DROP COLUMN "ageMax",
DROP COLUMN "ageMin",
DROP COLUMN "distance",
DROP COLUMN "interestedIn";

-- AlterTable
ALTER TABLE "profiles" DROP COLUMN "city",
DROP COLUMN "country",
DROP COLUMN "lastLocationUpdate",
DROP COLUMN "latitude",
DROP COLUMN "longitude",
DROP COLUMN "state",
ALTER COLUMN "photos" SET DEFAULT ARRAY[]::TEXT[];

-- CreateIndex
CREATE UNIQUE INDEX "matches_userId_productId_key" ON "matches"("userId", "productId");

-- AddForeignKey
ALTER TABLE "matches" ADD CONSTRAINT "matches_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "matches" ADD CONSTRAINT "matches_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;
