import { Module } from '@nestjs/common';
import { GetNotificationPreferencesUseCase } from './get-notification-preferences.use-case';
import { NotificationsService } from './notifications.service';
import { UpdateNotificationPreferencesUseCase } from './update-notification-preferences.use-case';

@Module({
  providers: [
    NotificationsService,
    GetNotificationPreferencesUseCase,
    UpdateNotificationPreferencesUseCase,
  ],
  exports: [NotificationsService, GetNotificationPreferencesUseCase, UpdateNotificationPreferencesUseCase],
})
export class NotificationsModule {}
