import type {
  CommunicationPreferenceKey,
  IntimacyPreferenceKey,
  MoodKey,
  PhysicalStateKey,
  PleasantActionKey,
} from './state-options';

export interface TelegramStartInput {
  telegramId: string;
  username?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  languageCode?: string | null;
  startPayload?: string | null;
}

export interface CreatePairLinkInput {
  telegramUserId: string;
}

export interface AcceptPairLinkInput {
  telegramUserId: string;
  token: string;
}

export interface UpdateProfileInput {
  telegramUserId: string;
  displayName?: string;
  locale?: string;
  timezone?: string;
  waitingForDisplayName?: boolean;
  pendingStartPayload?: string | null;
}

export interface CreateCheckInInput {
  telegramUserId: string;
  physicalStateKey: PhysicalStateKey;
  moodKeys: MoodKey[];
  communicationPreferenceKey: CommunicationPreferenceKey;
  intimacyPreferenceKey: IntimacyPreferenceKey;
  pleasantActionKeys: PleasantActionKey[];
  comment?: string | null;
}

export interface UpdateNotificationPreferencesInput {
  telegramUserId: string;
  firstHalfOfDayEnabled?: boolean;
  firstHalfOfDayTime?: string;
  secondHalfOfDayEnabled?: boolean;
  secondHalfOfDayTime?: string;
  partnerUpdateNotificationsEnabled?: boolean;
}
