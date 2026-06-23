import { createEmptyCheckInDraft } from './check-in-draft';

describe('createEmptyCheckInDraft', () => {
  it('creates a draft ready for multi-step check-in flow', () => {
    expect(createEmptyCheckInDraft()).toEqual({
      moodKeys: [],
      pleasantActionKeys: [],
      waitingForComment: false,
      comment: null,
    });
  });
});
