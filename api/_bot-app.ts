import 'reflect-metadata';
import { INestApplicationContext } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { BotModule } from '../apps/bot/src/bot.module';
import { TelegramBotService } from '../apps/bot/src/telegram/telegram-bot.service';

let appPromise: Promise<INestApplicationContext> | null = null;

export async function getTelegramBotService(): Promise<TelegramBotService> {
  appPromise ??= NestFactory.createApplicationContext(BotModule, {
    logger: ['error', 'warn', 'log'],
  });
  const app = await appPromise;
  return app.get(TelegramBotService);
}
