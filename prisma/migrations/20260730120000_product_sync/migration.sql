-- Scheduled product sync: per-shop sync configuration, human-edit tracking on
-- products, and the run/proposal review queue.
--
-- Additive only. No column is dropped or retyped, and every new column is
-- either nullable or has a default, so existing rows are untouched.

-- CreateEnum
CREATE TYPE "SyncRunStatus" AS ENUM ('RUNNING', 'PENDING_REVIEW', 'EMPTY', 'APPLIED', 'FAILED', 'DISCARDED');

-- CreateEnum
CREATE TYPE "SyncChangeType" AS ENUM ('CREATE', 'UPDATE', 'MISSING');

-- CreateEnum
CREATE TYPE "ProposalStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- AlterTable
ALTER TABLE "Shop" ADD COLUMN "syncPlatform" "ProductScrapeMethod",
                   ADD COLUMN "syncEnabled" BOOLEAN NOT NULL DEFAULT false,
                   ADD COLUMN "syncUrl" TEXT,
                   ADD COLUMN "allowInsecureOrigin" BOOLEAN NOT NULL DEFAULT false,
                   ADD COLUMN "lastSyncedAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "Product" ADD COLUMN "manualFields" TEXT[];

-- CreateTable
CREATE TABLE "ProductSyncRun" (
    "id" TEXT NOT NULL,
    "shopId" TEXT NOT NULL,
    "platform" "ProductScrapeMethod" NOT NULL,
    "status" "SyncRunStatus" NOT NULL DEFAULT 'RUNNING',
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "finishedAt" TIMESTAMP(3),
    "reviewedAt" TIMESTAMP(3),
    "reviewedById" TEXT,
    "fetchedCount" INTEGER NOT NULL DEFAULT 0,
    "errorMessage" TEXT,
    "insecureTLSCode" TEXT,
    "triggeredManually" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "ProductSyncRun_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProductSyncProposal" (
    "id" TEXT NOT NULL,
    "runId" TEXT NOT NULL,
    "productId" TEXT,
    "shopProductId" TEXT NOT NULL,
    "changeType" "SyncChangeType" NOT NULL,
    "status" "ProposalStatus" NOT NULL DEFAULT 'PENDING',
    "matchedBy" TEXT,
    "payload" JSONB NOT NULL,
    "diff" JSONB NOT NULL,

    CONSTRAINT "ProductSyncProposal_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ProductSyncRun_shopId_status_idx" ON "ProductSyncRun"("shopId", "status");

-- CreateIndex
CREATE INDEX "ProductSyncRun_status_startedAt_idx" ON "ProductSyncRun"("status", "startedAt");

-- CreateIndex
CREATE INDEX "ProductSyncProposal_runId_status_idx" ON "ProductSyncProposal"("runId", "status");

-- CreateIndex
CREATE INDEX "ProductSyncProposal_productId_idx" ON "ProductSyncProposal"("productId");

-- AddForeignKey
ALTER TABLE "ProductSyncRun" ADD CONSTRAINT "ProductSyncRun_shopId_fkey" FOREIGN KEY ("shopId") REFERENCES "Shop"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductSyncProposal" ADD CONSTRAINT "ProductSyncProposal_runId_fkey" FOREIGN KEY ("runId") REFERENCES "ProductSyncRun"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductSyncProposal" ADD CONSTRAINT "ProductSyncProposal_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;
