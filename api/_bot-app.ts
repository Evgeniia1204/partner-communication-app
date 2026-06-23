import 'reflect-metadata';
import { INestApplicationContext } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import type { TelegramBotService } from '../apps/bot/src/telegram/telegram-bot.service';

let appPromise: Promise<INestApplicationContext> | null = null;

export async function getTelegramBotService(): Promise<TelegramBotService> {
  if (!appPromise) {
    const { BotModule } = await import('../apps/bot/dist/apps/bot/src/bot.module.js');
    appPromise = NestFactory.createApplicationContext(BotModule, {
      logger: ['error', 'warn', 'log'],
    });
  }
  const app = await appPromise;
  const { TelegramBotService } = await import(
    '../apps/bot/dist/apps/bot/src/telegram/telegram-bot.service.js'
  );
  return app.get(TelegramBotService);
}
