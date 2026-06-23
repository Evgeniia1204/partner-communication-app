CREATE TABLE "CheckInDraft" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "physicalStateKey" TEXT,
  "moodKeys" TEXT[],
  "communicationPreferenceKey" TEXT,
  "intimacyPreferenceKey" TEXT,
  "pleasantActionKeys" TEXT[],
  "waitingForComment" BOOLEAN NOT NULL DEFAULT false,
  "comment" TEXT,
  "expiresAt" TIMESTAMP(3) NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "CheckInDraft_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "CheckInDraft_userId_key" ON "CheckInDraft"("userId");
CREATE INDEX "CheckInDraft_expiresAt_idx" ON "CheckInDraft"("expiresAt");

ALTER TABLE "CheckInDraft" ADD CONSTRAINT "CheckInDraft_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
