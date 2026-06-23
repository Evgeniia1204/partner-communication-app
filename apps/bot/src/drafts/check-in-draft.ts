import type {
  CommunicationPreferenceKey,
  IntimacyPreferenceKey,
  MoodKey,
  PhysicalStateKey,
  PleasantActionKey,
} from '@partner/shared/state-options';

export interface CheckInDraft {
  physicalStateKey?: PhysicalStateKey;
  moodKeys: MoodKey[];
  communicationPreferenceKey?: CommunicationPreferenceKey;
  intimacyPreferenceKey?: IntimacyPreferenceKey;
  pleasantActionKeys: PleasantActionKey[];
  waitingForComment: boolean;
  comment?: string | null;
}

export const createEmptyCheckInDraft = (): CheckInDraft => ({
  moodKeys: [],
  pleasantActionKeys: [],
  waitingForComment: false,
  comment: null,
});
