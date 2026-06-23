import { Injectable } from '@nestjs/common';
import type { TelegramStartInput } from '@partner/shared/inputs';
import { GetNotificationPreferencesUseCase } from '../notifications/get-notification-preferences.use-case';
import { UsersService } from './users.service';

@Injectable()
export class UpsertTelegramUserUseCase {
  public constructor(
    private readonly usersService: UsersService,
    private readonly getNotificationPreferences: GetNotificationPreferencesUseCase,
  ) {}

  public async execute(input: TelegramStartInput) {
    const user = await this.usersService.upsertTelegramUser({
      telegramId: input.telegramId,
      username: input.username,
      firstName: input.firstName,
      lastName: input.lastName,
      languageCode: input.languageCode,
    });

    await this.getNotificationPreferences.execute(input.telegramId);
    return user;
  }
}
