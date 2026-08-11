-- AlterTable
ALTER TABLE "public"."User"
ADD COLUMN "passwordResetToken" TEXT,
ADD COLUMN "passwordResetExpiresAt" TIMESTAMP(3);

-- CreateIndex
CREATE INDEX "User_passwordResetToken_idx" ON "public"."User"("passwordResetToken");
