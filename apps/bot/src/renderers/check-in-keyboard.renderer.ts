import { Injectable } from '@nestjs/common';
import {
  COMMUNICATION_PREFERENCE_KEYS,
  INTIMACY_PREFERENCE_KEYS,
  MOOD_KEYS,
  PHYSICAL_STATE_KEYS,
  PLEASANT_ACTION_KEYS,
} from '@partner/shared/state-options';
import { Markup } from 'telegraf';
import { I18nService } from '../i18n/i18n.service';

@Injectable()
export class CheckInKeyboardRenderer {
  public constructor(private readonly i18n: I18nService) {}

  public physical(locale: string) {
    const t = this.i18n.get(locale);
    return Markup.inlineKeyboard(
      PHYSICAL_STATE_KEYS.map((key) => [
        Markup.button.callback(t.options.physical[key], `checkin:physical:${key}`),
      ]),
    );
  }

  public moods(locale: string) {
    const t = this.i18n.get(locale);
    return Markup.inlineKeyboard(
      MOOD_KEYS.map((key) => [
        Markup.button.callback(t.options.moods[key], `checkin:mood:${key}`),
      ]),
    );
  }

  public communication(locale: string) {
    const t = this.i18n.get(locale);
    return Markup.inlineKeyboard(
      COMMUNICATION_PREFERENCE_KEYS.map((key) => [
        Markup.button.callback(t.options.communication[key], `checkin:communication:${key}`),
      ]),
    );
  }

  public intimacy(locale: string) {
    const t = this.i18n.get(locale);
    return Markup.inlineKeyboard(
      INTIMACY_PREFERENCE_KEYS.map((key) => [
        Markup.button.callback(t.options.intimacy[key], `checkin:intimacy:${key}`),
      ]),
    );
  }

  public pleasant(locale: string) {
    const t = this.i18n.get(locale);
    return Markup.inlineKeyboard(
      PLEASANT_ACTION_KEYS.map((key) => [
        Markup.button.callback(t.options.pleasant[key], `checkin:pleasant:${key}`),
      ]),
    );
  }

  public comment(locale: string) {
    const t = this.i18n.get(locale);
    return Markup.inlineKeyboard([
      [Markup.button.callback(t.checkIn.addComment, 'checkin:comment:add')],
      [Markup.button.callback(t.checkIn.skipComment, 'checkin:comment:skip')],
    ]);
  }

  public confirm(locale: string) {
    const t = this.i18n.get(locale);
    return Markup.inlineKeyboard([
      [Markup.button.callback(t.checkIn.confirmYes, 'checkin:confirm')],
      [Markup.button.callback(t.menu.cancel, 'checkin:cancel')],
    ]);
  }
}
