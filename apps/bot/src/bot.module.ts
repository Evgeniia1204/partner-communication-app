import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { resolve } from 'node:path';
import { AppConfigModule } from '../../api/src/config/app-config.module';
import { CheckInsModule } from '../../api/src/core/check-ins/check-ins.module';
import { CouplesModule } from '../../api/src/core/couples/couples.module';
import { NotificationsModule } from '../../api/src/core/notifications/notifications.module';
import { TelegramUpdatesModule } from '../../api/src/core/telegram-updates/telegram-updates.module';
import { UsersModule } from '../../api/src/core/users/users.module';
import { PrismaModule } from '../../api/src/prisma/prisma.module';
import { DraftService } from './drafts/draft.service';
import { I18nService } from './i18n/i18n.service';
import { CheckInKeyboardRenderer } from './renderers/check-in-keyboard.renderer';
import { MenuRenderer } from './renderers/menu.renderer';
import { TelegramBotService } from './telegram/telegram-bot.service';

@Module({
  imports: [
    ConfigModule.forRoot({
      envFilePath: [resolve(process.cwd(), '../../.env'), resolve(process.cwd(), '.env')],
      isGlobal: true,
    }),
    AppConfigModule,
    PrismaModule,
    UsersModule,
    CouplesModule,
    CheckInsModule,
    NotificationsModule,
    TelegramUpdatesModule,
  ],
  providers: [
    DraftService,
    I18nService,
    MenuRenderer,
    CheckInKeyboardRenderer,
    TelegramBotService,
  ],
})
export class BotModule {}
