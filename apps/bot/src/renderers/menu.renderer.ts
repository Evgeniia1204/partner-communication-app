import { Injectable } from '@nestjs/common';
import { Markup } from 'telegraf';
import { I18nService } from '../i18n/i18n.service';

@Injectable()
export class MenuRenderer {
  public constructor(private readonly i18n: I18nService) {}

  public main(locale: string | null | undefined, hasCouple: boolean) {
    const t = this.i18n.get(locale);
    if (!hasCouple) {
      return Markup.inlineKeyboard([
        [Markup.button.callback(t.menu.createPairLink, 'pair:create_link')],
        [Markup.button.callback(t.menu.settings, 'settings:main')],
      ]);
    }
    return Markup.inlineKeyboard([
      [Markup.button.callback(t.menu.updateState, 'checkin:start')],
      [Markup.button.callback(t.menu.partnerState, 'partner:current')],
      [Markup.button.callback(t.menu.settings, 'settings:main')],
    ]);
  }

  public reply(locale: string | null | undefined, hasCouple: boolean) {
    const t = this.i18n.get(locale);
    if (!hasCouple) {
      return Markup.keyboard([[t.menu.createPairLink], [t.menu.settings]]).resize();
    }
    return Markup.keyboard([
      [t.menu.updateState],
      [t.menu.partnerState, t.menu.myState],
      [t.menu.settings],
    ]).resize();
  }
}
