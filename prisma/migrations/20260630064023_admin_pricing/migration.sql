-- CreateTable
CREATE TABLE "FruitPrice" (
    "id" TEXT NOT NULL,
    "fruit" TEXT NOT NULL,
    "priceQAR" DECIMAL(10,2) NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FruitPrice_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FruitMixPrice" (
    "id" TEXT NOT NULL,
    "fruitsKey" TEXT NOT NULL,
    "label" TEXT,
    "priceQAR" DECIMAL(10,2) NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FruitMixPrice_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "FruitPrice_fruit_key" ON "FruitPrice"("fruit");

-- CreateIndex
CREATE UNIQUE INDEX "FruitMixPrice_fruitsKey_key" ON "FruitMixPrice"("fruitsKey");
