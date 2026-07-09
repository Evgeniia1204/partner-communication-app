import type {
  CommunicationPreferenceKey,
  IntimacyPreferenceKey,
  MoodKey,
  PhysicalStateKey,
  PleasantActionKey,
} from '@partner/shared/state-options';

type SummaryLocale = 'ru' | 'en';

const ruPhysical: Record<PhysicalStateKey, string> = {
  full_of_energy: 'много сил',
  feeling_good: 'хорошее самочувствие',
  slightly_tired: 'немного усталое состояние',
  tired: 'усталость',
  very_tired: 'сильная усталость',
  not_feeling_well: 'самочувствие не очень',
  sick: 'болеет',
};

const ruMoods: Record<MoodKey, string> = {
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

const ruCommunication: Record<CommunicationPreferenceKey, string> = {
  active_talk: 'можно активно общаться',
  calm_talk: 'лучше подойдёт спокойный разговор',
  texting: 'комфортнее переписываться',
  just_be_near: 'хочется просто быть рядом',
  alone_time: 'важно немного побыть одному/одной',
};

const ruIntimacy: Record<IntimacyPreferenceKey, string> = {
  hugs: 'объятия',
  touch: 'прикосновения',
  kisses: 'поцелуи',
  romance: 'романтика',
  flirting: 'флирт',
  sex: 'секс',
  none: 'сейчас не очень нужна',
};

const ruPleasant: Record<PleasantActionKey, string> = {
  support: 'поддержка',
  help: 'помощь',
  compliment: 'комплимент',
  quality_time: 'совместное время',
  walk: 'прогулка',
  tasty_food: 'вкусная еда',
  care: 'забота',
  space: 'пространство',
  listen_to_me: 'чтобы его/её выслушали',
  do_something_together: 'сделать что-то вместе',
  nothing_needed: 'ничего дополнительного',
};

const enPhysical: Record<PhysicalStateKey, string> = {
  full_of_energy: 'has plenty of energy',
  feeling_good: 'is feeling good',
  slightly_tired: 'is a little tired',
  tired: 'is tired',
  very_tired: 'is very tired',
  not_feeling_well: 'is not feeling great',
  sick: 'is feeling sick',
};

const enMoods: Record<MoodKey, string> = {
  calm: 'calm',
  joyful: 'joyful',
  inspired: 'inspired',
  anxious: 'anxious',
  irritated: 'irritated',
  sad: 'sad',
  overloaded: 'overloaded',
  confused: 'confused',
  lonely: 'lonely',
};

const enCommunication: Record<CommunicationPreferenceKey, string> = {
  active_talk: 'active conversation is welcome',
  calm_talk: 'a calm conversation would feel best',
  texting: 'texting feels most comfortable',
  just_be_near: 'just being nearby would feel good',
  alone_time: 'some alone time matters right now',
};

const enIntimacy: Record<IntimacyPreferenceKey, string> = {
  hugs: 'hugs',
  touch: 'touch',
  kisses: 'kisses',
  romance: 'romance',
  flirting: 'flirting',
  sex: 'sex',
  none: 'does not feel especially needed right now',
};

const enPleasant: Record<PleasantActionKey, string> = {
  support: 'support',
  help: 'help',
  compliment: 'a compliment',
  quality_time: 'quality time together',
  walk: 'a walk',
  tasty_food: 'good food',
  care: 'care',
  space: 'space',
  listen_to_me: 'being listened to',
  do_something_together: 'doing something together',
  nothing_needed: 'nothing extra',
};

interface SummaryInput {
  displayName: string;
  locale?: string | null;
  physicalStateKey: PhysicalStateKey;
  moodKeys: MoodKey[];
  communicationPreferenceKey: CommunicationPreferenceKey;
  intimacyPreferenceKey: IntimacyPreferenceKey;
  pleasantActionKeys: PleasantActionKey[];
  comment?: string | null;
}

export class CheckInSummaryService {
  public build(input: SummaryInput): string {
    return this.locale(input.locale) === 'en' ? this.buildEn(input) : this.buildRu(input);
  }

  private buildRu(input: SummaryInput): string {
    const lines = [`${input.displayName} сейчас: ${ruPhysical[input.physicalStateKey]}.`];
    const mood = input.moodKeys.map((key) => ruMoods[key]).join(' и ');
    if (mood) {
      lines.push(`По настроению — ${mood}.`);
    }
    lines.push(`В общении сейчас ${ruCommunication[input.communicationPreferenceKey]}.`);
    lines.push(this.ruIntimacySentence(input.intimacyPreferenceKey));

    const pleasant = input.pleasantActionKeys.map((key) => ruPleasant[key]).join(', ');
    if (pleasant) {
      lines.push(`Из приятного — ${pleasant}.`);
    }

    const comment = input.comment?.trim();
    if (comment) {
      lines.push(`Комментарий: ${comment}`);
    }

    return lines.join('\n');
  }

  private buildEn(input: SummaryInput): string {
    const lines = [`Right now, ${input.displayName} ${enPhysical[input.physicalStateKey]}.`];
    const mood = input.moodKeys.map((key) => enMoods[key]).join(' and ');
    if (mood) {
      lines.push(`Mood-wise: ${mood}.`);
    }
    lines.push(`For communication, ${enCommunication[input.communicationPreferenceKey]}.`);
    lines.push(this.enIntimacySentence(input.intimacyPreferenceKey));

    const pleasant = input.pleasantActionKeys.map((key) => enPleasant[key]).join(', ');
    if (pleasant) {
      lines.push(`Something that would feel good: ${pleasant}.`);
    }

    const comment = input.comment?.trim();
    if (comment) {
      lines.push(`Comment: ${comment}`);
    }

    return lines.join('\n');
  }

  private ruIntimacySentence(key: IntimacyPreferenceKey): string {
    if (key === 'none') {
      return `Близость ${ruIntimacy[key]}.`;
    }
    return `Из близости сейчас подойдут ${ruIntimacy[key]}.`;
  }

  private enIntimacySentence(key: IntimacyPreferenceKey): string {
    if (key === 'none') {
      return `Closeness ${enIntimacy[key]}.`;
    }
    return `For closeness, ${enIntimacy[key]} would feel good.`;
  }

  private locale(value: string | null | undefined): SummaryLocale {
    return value?.toLowerCase().startsWith('en') ? 'en' : 'ru';
  }
}
