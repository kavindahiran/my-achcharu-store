/*
  Warnings:

  - Changed the type of `baseFruit` on the `CustomAchcharu` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- AlterTable
ALTER TABLE "CustomAchcharu" DROP COLUMN "baseFruit",
ADD COLUMN     "baseFruit" TEXT NOT NULL;
