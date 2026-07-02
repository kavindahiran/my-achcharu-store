-- Cast AddOn.type from AddOnType enum to TEXT (preserves existing rows: MALDIVE_FISH, CASHEW_NUTS, PICKLED_DATES)
ALTER TABLE "AddOn" ALTER COLUMN "type" TYPE TEXT USING "type"::TEXT;

-- Add sortOrder to AddOn
ALTER TABLE "AddOn" ADD COLUMN "sortOrder" INTEGER NOT NULL DEFAULT 0;

-- Cast CustomAchcharu.spiceLevel from SpiceLevel enum to TEXT (preserves any existing order data)
ALTER TABLE "CustomAchcharu" ALTER COLUMN "spiceLevel" TYPE TEXT USING "spiceLevel"::TEXT;

-- DropEnum (safe now that no column references them)
DROP TYPE "AddOnType";
DROP TYPE "SpiceLevel";

-- CreateTable
CREATE TABLE "SpiceOption" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "emoji" TEXT NOT NULL DEFAULT '🌶️',
    "description" TEXT,
    "multiplier" DECIMAL(5,3) NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SpiceOption_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "SpiceOption_key_key" ON "SpiceOption"("key");
