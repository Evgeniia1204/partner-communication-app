CREATE TABLE "User" (
  "id" TEXT NOT NULL,
  "telegramId" TEXT NOT NULL,
  "telegramUsername" TEXT,
  "firstName" TEXT,
  "lastName" TEXT,
  "displayName" TEXT NOT NULL,
  "locale" TEXT NOT NULL,
  "timezone" TEXT NOT NULL,
  "isBotBlocked" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  "deletedAt" TIMESTAMP(3),
  CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "PairLink" (
  "id" TEXT NOT NULL,
  "creatorId" TEXT NOT NULL,
  "tokenHash" TEXT NOT NULL,
  "expiresAt" TIMESTAMP(3) NOT NULL,
  "acceptedById" TEXT,
  "acceptedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "PairLink_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Couple" (
  "id" TEXT NOT NULL,
  "partnerAId" TEXT NOT NULL,
  "partnerBId" TEXT NOT NULL,
  "createdByPairLinkId" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "endedAt" TIMESTAMP(3),
  CONSTRAINT "Couple_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "CheckIn" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "coupleId" TEXT NOT NULL,
  "physicalStateKey" TEXT NOT NULL,
  "communicationPreferenceKey" TEXT NOT NULL,
  "intimacyPreferenceKey" TEXT NOT NULL,
  "comment" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "CheckIn_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "CheckInMood" (
  "id" TEXT NOT NULL,
  "checkInId" TEXT NOT NULL,
  "moodKey" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "CheckInMood_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "CheckInPleasantAction" (
  "id" TEXT NOT NULL,
  "checkInId" TEXT NOT NULL,
  "pleasantActionKey" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "CheckInPleasantAction_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "NotificationPreference" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "firstHalfOfDayEnabled" BOOLEAN NOT NULL DEFAULT true,
  "firstHalfOfDayTime" TEXT NOT NULL,
  "secondHalfOfDayEnabled" BOOLEAN NOT NULL DEFAULT true,
  "secondHalfOfDayTime" TEXT NOT NULL,
  "partnerUpdateNotificationsEnabled" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "NotificationPreference_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "TelegramUpdateLog" (
  "id" TEXT NOT NULL,
  "telegramUpdateId" TEXT NOT NULL,
  "processedAt" TIMESTAMP(3) NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "TelegramUpdateLog_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ReminderDeliveryLog" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "period" TEXT NOT NULL,
  "localDate" TEXT NOT NULL,
  "sentAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ReminderDeliveryLog_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "User_telegramId_key" ON "User"("telegramId");
CREATE UNIQUE INDEX "PairLink_tokenHash_key" ON "PairLink"("tokenHash");
CREATE UNIQUE INDEX "Couple_createdByPairLinkId_key" ON "Couple"("createdByPairLinkId");
CREATE INDEX "Couple_partnerAId_endedAt_idx" ON "Couple"("partnerAId", "endedAt");
CREATE INDEX "Couple_partnerBId_endedAt_idx" ON "Couple"("partnerBId", "endedAt");
CREATE INDEX "CheckIn_userId_createdAt_idx" ON "CheckIn"("userId", "createdAt");
CREATE INDEX "CheckIn_coupleId_createdAt_idx" ON "CheckIn"("coupleId", "createdAt");
CREATE UNIQUE INDEX "NotificationPreference_userId_key" ON "NotificationPreference"("userId");
CREATE UNIQUE INDEX "TelegramUpdateLog_telegramUpdateId_key" ON "TelegramUpdateLog"("telegramUpdateId");
CREATE UNIQUE INDEX "ReminderDeliveryLog_userId_period_localDate_key" ON "ReminderDeliveryLog"("userId", "period", "localDate");

ALTER TABLE "PairLink" ADD CONSTRAINT "PairLink_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "PairLink" ADD CONSTRAINT "PairLink_acceptedById_fkey" FOREIGN KEY ("acceptedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Couple" ADD CONSTRAINT "Couple_partnerAId_fkey" FOREIGN KEY ("partnerAId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Couple" ADD CONSTRAINT "Couple_partnerBId_fkey" FOREIGN KEY ("partnerBId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Couple" ADD CONSTRAINT "Couple_createdByPairLinkId_fkey" FOREIGN KEY ("createdByPairLinkId") REFERENCES "PairLink"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "CheckIn" ADD CONSTRAINT "CheckIn_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "CheckIn" ADD CONSTRAINT "CheckIn_coupleId_fkey" FOREIGN KEY ("coupleId") REFERENCES "Couple"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "CheckInMood" ADD CONSTRAINT "CheckInMood_checkInId_fkey" FOREIGN KEY ("checkInId") REFERENCES "CheckIn"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CheckInPleasantAction" ADD CONSTRAINT "CheckInPleasantAction_checkInId_fkey" FOREIGN KEY ("checkInId") REFERENCES "CheckIn"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "NotificationPreference" ADD CONSTRAINT "NotificationPreference_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "ReminderDeliveryLog" ADD CONSTRAINT "ReminderDeliveryLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
