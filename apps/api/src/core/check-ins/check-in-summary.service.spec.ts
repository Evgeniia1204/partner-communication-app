import { CheckInSummaryService } from './check-in-summary.service';

describe('CheckInSummaryService', () => {
  it('builds a human-readable partner summary', () => {
    const service = new CheckInSummaryService();

    const summary = service.build({
      displayName: 'Женя',
      physicalStateKey: 'slightly_tired',
      moodKeys: ['calm'],
      communicationPreferenceKey: 'texting',
      intimacyPreferenceKey: 'hugs',
      pleasantActionKeys: ['support'],
      comment: 'Мне нужно немного тишины',
    });

    expect(summary).toContain('Женя');
    expect(summary).toContain('немного устал(а)');
    expect(summary).toContain('спокойно');
    expect(summary).toContain('переписываться');
    expect(summary).toContain('поддержке');
    expect(summary).toContain('Комментарий: Мне нужно немного тишины');
  });
});
