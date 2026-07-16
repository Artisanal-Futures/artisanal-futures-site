-- AlterTable
ALTER TABLE "PlatformInvite" ADD COLUMN "shopId" TEXT;

-- AddForeignKey
ALTER TABLE "PlatformInvite" ADD CONSTRAINT "PlatformInvite_shopId_fkey" FOREIGN KEY ("shopId") REFERENCES "Shop"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- CreateIndex
CREATE INDEX "PlatformInvite_shopId_idx" ON "PlatformInvite"("shopId");
