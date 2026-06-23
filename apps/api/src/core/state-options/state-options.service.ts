import { Injectable } from '@nestjs/common';
import {
  COMMUNICATION_PREFERENCE_KEYS,
  INTIMACY_PREFERENCE_KEYS,
  MOOD_KEYS,
  PHYSICAL_STATE_KEYS,
  PLEASANT_ACTION_KEYS,
} from '@partner/shared/state-options';

@Injectable()
export class StateOptionsService {
  public getOptions() {
    return {
      physicalStates: PHYSICAL_STATE_KEYS,
      moods: MOOD_KEYS,
      communicationPreferences: COMMUNICATION_PREFERENCE_KEYS,
      intimacyPreferences: INTIMACY_PREFERENCE_KEYS,
      pleasantActions: PLEASANT_ACTION_KEYS,
    };
  }
}
