import { Injectable } from '@nestjs/common';
import { DEFAULT_LOCALE } from '@partner/shared/constants';
import type { UpdateProfileInput } from '@partner/shared/inputs';
import { PrismaService } from '../../prisma/prisma.service';
import { AppConfigService } from '../../config/app-config.service';

export interface TelegramUserProfile {
  telegramId: string;
  username?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  languageCode?: string | null;
}

@Injectable()
export class UsersService {
  public constructor(
    private readonly prisma: PrismaService,
    private readonly config: AppConfigService,
  ) {}

  public async upsertTelegramUser(input: TelegramUserProfile) {
    const displayName =
      input.firstName ?? input.username ?? `Telegram ${input.telegramId.slice(-4)}`;

    return this.prisma.user.upsert({
      where: { telegramId: input.telegramId },
      create: {
        telegramId: input.telegramId,
        telegramUsername: input.username,
        firstName: input.firstName,
        lastName: input.lastName,
        displayName,
        locale: DEFAULT_LOCALE,
        timezone: this.config.defaultTimezone,
      },
      update: {
        telegramUsername: input.username,
        firstName: input.firstName,
        lastName: input.lastName,
        displayName,
        isBotBlocked: false,
      },
    });
  }

  public async findByTelegramId(telegramId: string) {
    return this.prisma.user.findUnique({ where: { telegramId } });
  }

  public async markBotBlocked(userId: string): Promise<void> {
    await this.prisma.user.update({ where: { id: userId }, data: { isBotBlocked: true } });
  }

  public async updateProfile(input: UpdateProfileInput) {
    const user = await this.findByTelegramId(input.telegramUserId);
    if (!user) {
      return null;
    }
    return this.prisma.user.update({
      where: { id: user.id },
      data: {
        displayName: input.displayName,
        locale: input.locale,
        timezone: input.timezone,
      },
    });
  }
}
