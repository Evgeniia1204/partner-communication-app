export const PHYSICAL_STATE_KEYS = [
  'full_of_energy',
  'feeling_good',
  'slightly_tired',
  'tired',
  'very_tired',
  'not_feeling_well',
  'sick',
] as const;

export const MOOD_KEYS = [
  'calm',
  'joyful',
  'inspired',
  'anxious',
  'irritated',
  'sad',
  'overloaded',
  'confused',
  'lonely',
] as const;

export const COMMUNICATION_PREFERENCE_KEYS = [
  'active_talk',
  'calm_talk',
  'texting',
  'just_be_near',
  'alone_time',
] as const;

export const INTIMACY_PREFERENCE_KEYS = [
  'hugs',
  'touch',
  'kisses',
  'romance',
  'flirting',
  'sex',
  'none',
] as const;

export const PLEASANT_ACTION_KEYS = [
  'support',
  'help',
  'compliment',
  'quality_time',
  'walk',
  'tasty_food',
  'care',
  'space',
  'listen_to_me',
  'do_something_together',
  'nothing_needed',
] as const;

export type PhysicalStateKey = (typeof PHYSICAL_STATE_KEYS)[number];
export type MoodKey = (typeof MOOD_KEYS)[number];
export type CommunicationPreferenceKey = (typeof COMMUNICATION_PREFERENCE_KEYS)[number];
export type IntimacyPreferenceKey = (typeof INTIMACY_PREFERENCE_KEYS)[number];
export type PleasantActionKey = (typeof PLEASANT_ACTION_KEYS)[number];

const includes = <T extends readonly string[]>(values: T, value: string): value is T[number] =>
  values.includes(value);

export const isPhysicalStateKey = (value: string): value is PhysicalStateKey =>
  includes(PHYSICAL_STATE_KEYS, value);

export const isMoodKey = (value: string): value is MoodKey => includes(MOOD_KEYS, value);

export const isCommunicationPreferenceKey = (
  value: string,
): value is CommunicationPreferenceKey => includes(COMMUNICATION_PREFERENCE_KEYS, value);

export const isIntimacyPreferenceKey = (value: string): value is IntimacyPreferenceKey =>
  includes(INTIMACY_PREFERENCE_KEYS, value);

export const isPleasantActionKey = (value: string): value is PleasantActionKey =>
  includes(PLEASANT_ACTION_KEYS, value);
