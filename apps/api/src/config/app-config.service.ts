import { Injectable } from '@nestjs/common';
import {
  CHECK_IN_COMMENT_MAX_LENGTH,
  DEFAULT_PAIR_LINK_TTL_MINUTES,
  DEFAULT_TIMEZONE,
} from '@partner/shared/constants';

@Injectable()
export class AppConfigService {
  public get port(): number {
    return Number(process.env.PORT ?? 3001);
  }

  public get telegramBotToken(): string {
    return process.env.TELEGRAM_BOT_TOKEN ?? '';
  }

  public get telegramBotUsername(): string {
    return process.env.TELEGRAM_BOT_USERNAME ?? '';
  }

  public get appPublicUrl(): string {
    return process.env.APP_PUBLIC_URL ?? '';
  }

  public get pairLinkTtlMinutes(): number {
    return Number(process.env.PAIR_LINK_TTL_MINUTES ?? DEFAULT_PAIR_LINK_TTL_MINUTES);
  }

  public get checkInCommentMaxLength(): number {
    return Number(process.env.CHECK_IN_COMMENT_MAX_LENGTH ?? CHECK_IN_COMMENT_MAX_LENGTH);
  }

  public get defaultTimezone(): string {
    return process.env.DEFAULT_TIMEZONE ?? DEFAULT_TIMEZONE;
  }
}
