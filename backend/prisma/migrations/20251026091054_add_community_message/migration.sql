-- CreateTable
CREATE TABLE "public"."CommunityMessage" (
    "id" SERIAL NOT NULL,
    "communityId" INTEGER NOT NULL,
    "senderId" INTEGER NOT NULL,
    "content" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CommunityMessage_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "CommunityMessage_communityId_createdAt_idx" ON "public"."CommunityMessage"("communityId", "createdAt");

-- CreateIndex
CREATE INDEX "CommunityMessage_senderId_idx" ON "public"."CommunityMessage"("senderId");

-- AddForeignKey
ALTER TABLE "public"."CommunityMessage" ADD CONSTRAINT "CommunityMessage_communityId_fkey" FOREIGN KEY ("communityId") REFERENCES "public"."Community"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."CommunityMessage" ADD CONSTRAINT "CommunityMessage_senderId_fkey" FOREIGN KEY ("senderId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
