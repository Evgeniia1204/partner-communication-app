import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { resolve } from 'node:path';
import { CheckInsModule } from './core/check-ins/check-ins.module';
import { CouplesModule } from './core/couples/couples.module';
import { NotificationsModule } from './core/notifications/notifications.module';
import { StateOptionsModule } from './core/state-options/state-options.module';
import { TelegramUpdatesModule } from './core/telegram-updates/telegram-updates.module';
import { UsersModule } from './core/users/users.module';
import { AppConfigModule } from './config/app-config.module';
import { HealthModule } from './health/health.module';
import { PrismaModule } from './prisma/prisma.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      envFilePath: [resolve(process.cwd(), '../../.env'), resolve(process.cwd(), '.env')],
      isGlobal: true,
    }),
    AppConfigModule,
    PrismaModule,
    HealthModule,
    UsersModule,
    CouplesModule,
    CheckInsModule,
    NotificationsModule,
    StateOptionsModule,
    TelegramUpdatesModule,
  ],
})
export class AppModule {}
