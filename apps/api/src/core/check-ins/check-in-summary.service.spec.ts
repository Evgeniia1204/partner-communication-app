import { CheckInSummaryService } from './check-in-summary.service';

describe('CheckInSummaryService', () => {
  it('builds a warmer Russian partner summary', () => {
    const service = new CheckInSummaryService();

    const summary = service.build({
      displayName: 'Женя',
      locale: 'ru',
      physicalStateKey: 'slightly_tired',
      moodKeys: ['calm'],
      communicationPreferenceKey: 'texting',
      intimacyPreferenceKey: 'hugs',
      pleasantActionKeys: ['support'],
      comment: 'Мне нужно немного тишины',
    });

    expect(summary).toContain('Женя сейчас: немного усталое состояние.');
    expect(summary).toContain('По настроению — спокойно.');
    expect(summary).toContain('В общении сейчас комфортнее переписываться.');
    expect(summary).toContain('Из близости сейчас подойдут объятия.');
    expect(summary).toContain('Из приятного — поддержка.');
    expect(summary).toContain('Комментарий: Мне нужно немного тишины');
  });

  it('builds an English partner summary for English readers', () => {
    const service = new CheckInSummaryService();

    const summary = service.build({
      displayName: 'Jane',
      locale: 'en',
      physicalStateKey: 'feeling_good',
      moodKeys: ['joyful'],
      communicationPreferenceKey: 'calm_talk',
      intimacyPreferenceKey: 'none',
      pleasantActionKeys: ['quality_time'],
      comment: 'A quiet evening would be nice',
    });

    expect(summary).toContain('Right now, Jane is feeling good.');
    expect(summary).toContain('Mood-wise: joyful.');
    expect(summary).toContain('For communication, a calm conversation would feel best.');
    expect(summary).toContain('Closeness does not feel especially needed right now.');
    expect(summary).toContain('Something that would feel good: quality time together.');
    expect(summary).toContain('Comment: A quiet evening would be nice');
  });
});
