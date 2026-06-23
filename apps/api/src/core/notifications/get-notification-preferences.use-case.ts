import { Injectable } from '@nestjs/common';
import { NotificationsService } from './notifications.service';

@Injectable()
export class GetNotificationPreferencesUseCase {
  public constructor(private readonly notificationsService: NotificationsService) {}

  public async execute(telegramUserId: string) {
    return this.notificationsService.getOrCreateForTelegramUser(telegramUserId);
  }
}
