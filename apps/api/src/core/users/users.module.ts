import { Module } from '@nestjs/common';
import { NotificationsModule } from '../notifications/notifications.module';
import { UpdateProfileUseCase } from './update-profile.use-case';
import { UpsertTelegramUserUseCase } from './upsert-telegram-user.use-case';
import { UsersService } from './users.service';

@Module({
  imports: [NotificationsModule],
  providers: [UsersService, UpsertTelegramUserUseCase, UpdateProfileUseCase],
  exports: [UsersService, UpsertTelegramUserUseCase, UpdateProfileUseCase],
})
export class UsersModule {}
