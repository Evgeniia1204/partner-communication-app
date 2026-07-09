ALTER TABLE "User" ADD COLUMN "waitingForDisplayName" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "User" ADD COLUMN "pendingStartPayload" TEXT;
