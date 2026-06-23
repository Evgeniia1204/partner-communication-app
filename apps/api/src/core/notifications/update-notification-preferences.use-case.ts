import { Injectable } from '@nestjs/common';
import type { UpdateNotificationPreferencesInput } from '@partner/shared/inputs';
import { NotificationsService } from './notifications.service';

@Injectable()
export class UpdateNotificationPreferencesUseCase {
  public constructor(private readonly notificationsService: NotificationsService) {}

  public async execute(input: UpdateNotificationPreferencesInput) {
    return this.notificationsService.update(input);
  }
}
