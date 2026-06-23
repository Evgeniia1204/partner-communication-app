import { Module } from '@nestjs/common';
import { TelegramUpdatesService } from './telegram-updates.service';

@Module({
  providers: [TelegramUpdatesService],
  exports: [TelegramUpdatesService],
})
export class TelegramUpdatesModule {}
