import type {
  CommunicationPreferenceKey,
  IntimacyPreferenceKey,
  MoodKey,
  PhysicalStateKey,
  PleasantActionKey,
} from '@partner/shared/state-options';

const physicalLabels: Record<PhysicalStateKey, string> = {
  full_of_energy: 'полон/полна сил',
  feeling_good: 'хорошо себя чувствует',
  slightly_tired: 'немного устал(а)',
  tired: 'устал(а)',
  very_tired: 'очень устал(а)',
  not_feeling_well: 'неважно себя чувствует',
  sick: 'болеет',
};

const moodLabels: Record<MoodKey, string> = {
  calm: 'спокойно',
  joyful: 'радостно',
  inspired: 'вдохновлённо',
  anxious: 'тревожно',
  irritated: 'раздражённо',
  sad: 'грустно',
  overloaded: 'перегруженно',
  confused: 'растерянно',
  lonely: 'одиноко',
};

const communicationLabels: Record<CommunicationPreferenceKey, string> = {
  active_talk: 'готов(а) активно общаться',
  calm_talk: 'предпочитает спокойный разговор',
  texting: 'предпочитает переписываться',
  just_be_near: 'хочет просто быть рядом',
  alone_time: 'хочет побыть одному/одной',
};

const intimacyLabels: Record<IntimacyPreferenceKey, string> = {
  hugs: 'объятиям',
  touch: 'прикосновениям',
  kisses: 'поцелуям',
  romance: 'романтике',
  flirting: 'флирту',
  sex: 'сексу',
  none: 'ничему из блока близости',
};

const pleasantActionLabels: Record<PleasantActionKey, string> = {
  support: 'поддержке',
  help: 'помощи',
  compliment: 'комплименту',
  quality_time: 'совместному времени',
  walk: 'прогулке',
  tasty_food: 'вкусной еде',
  care: 'заботе',
  space: 'пространству',
  listen_to_me: 'тому, чтобы его/её выслушали',
  do_something_together: 'чему-то вместе',
  nothing_needed: 'ничему дополнительному',
};

interface SummaryInput {
  displayName: string;
  physicalStateKey: PhysicalStateKey;
  moodKeys: MoodKey[];
  communicationPreferenceKey: CommunicationPreferenceKey;
  intimacyPreferenceKey: IntimacyPreferenceKey;
  pleasantActionKeys: PleasantActionKey[];
  comment?: string | null;
}

export class CheckInSummaryService {
  public build(input: SummaryInput): string {
    const moods = input.moodKeys.map((key) => moodLabels[key]).join(' и ');
    const pleasant = input.pleasantActionKeys
      .map((key) => pleasantActionLabels[key])
      .join(', ');
    const moodPart = moods ? `, чувствует себя ${moods}` : '';
    const pleasantPart = pleasant ? ` и был(а) бы рад(а) ${pleasant}` : '';
    const intimacyPart =
      input.intimacyPreferenceKey === 'none'
        ? ''
        : `, сейчас открыт(а) к ${intimacyLabels[input.intimacyPreferenceKey]}`;
    const comment = input.comment?.trim();
    const commentPart = comment ? `\n\nКомментарий: ${comment}` : '';

    return `Сейчас ${input.displayName} ${physicalLabels[input.physicalStateKey]}${moodPart}, ${communicationLabels[input.communicationPreferenceKey]}${intimacyPart}${pleasantPart}.${commentPart}`;
  }
}
