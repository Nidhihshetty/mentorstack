/*
  Manual Migration: Rename ReputationHistory columns and add new fields
  
  This migration:
  - Renames 'change' to 'points' (preserves data)
  - Renames 'reason' to 'action' (preserves data)
  - Adds new optional columns to ReputationHistory
  - Adds new columns to Badge
  - Adds isDisplayed to UserBadge
  - Removes updatedAt from ReputationHistory and UserBadge
  - Creates performance indexes
*/

-- ReputationHistory: Rename columns (preserves all existing data)
ALTER TABLE "public"."ReputationHistory" RENAME COLUMN "change" TO "points";
ALTER TABLE "public"."ReputationHistory" RENAME COLUMN "reason" TO "action";

-- ReputationHistory: Add new optional columns
ALTER TABLE "public"."ReputationHistory" ADD COLUMN "entityType" TEXT;
ALTER TABLE "public"."ReputationHistory" ADD COLUMN "entityId" INTEGER;
ALTER TABLE "public"."ReputationHistory" ADD COLUMN "description" TEXT;

-- ReputationHistory: Remove updatedAt column
ALTER TABLE "public"."ReputationHistory" DROP COLUMN "updatedAt";

-- ReputationHistory: Add index for efficient timeline queries
CREATE INDEX "ReputationHistory_userId_createdAt_idx" ON "public"."ReputationHistory"("userId", "createdAt");

-- Badge: Add new columns
ALTER TABLE "public"."Badge" ADD COLUMN "imageUrl" TEXT;
ALTER TABLE "public"."Badge" ADD COLUMN "category" TEXT;
ALTER TABLE "public"."Badge" ADD COLUMN "isActive" BOOLEAN NOT NULL DEFAULT true;

-- UserBadge: Add isDisplayed column
ALTER TABLE "public"."UserBadge" ADD COLUMN "isDisplayed" BOOLEAN NOT NULL DEFAULT true;

-- UserBadge: Remove updatedAt column
ALTER TABLE "public"."UserBadge" DROP COLUMN "updatedAt";

-- UserBadge: Add index for efficient timeline queries
CREATE INDEX "UserBadge_userId_awardedAt_idx" ON "public"."UserBadge"("userId", "awardedAt");
