import {
  isCommunicationPreferenceKey,
  isIntimacyPreferenceKey,
  isMoodKey,
  isPhysicalStateKey,
  isPleasantActionKey,
} from './state-options';

describe('state option validators', () => {
  it('accepts known check-in option keys', () => {
    expect(isPhysicalStateKey('tired')).toBe(true);
    expect(isMoodKey('calm')).toBe(true);
    expect(isCommunicationPreferenceKey('texting')).toBe(true);
    expect(isIntimacyPreferenceKey('hugs')).toBe(true);
    expect(isPleasantActionKey('support')).toBe(true);
  });

  it('rejects unknown option keys', () => {
    expect(isPhysicalStateKey('hungry')).toBe(false);
    expect(isMoodKey('furious')).toBe(false);
    expect(isCommunicationPreferenceKey('video_call')).toBe(false);
    expect(isIntimacyPreferenceKey('therapy')).toBe(false);
    expect(isPleasantActionKey('quiz')).toBe(false);
  });
});
