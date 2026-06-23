import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { BotModule } from './bot.module';
import { TelegramBotService } from './telegram/telegram-bot.service';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.createApplicationContext(BotModule);
  const bot = app.get(TelegramBotService);
  await bot.launch();
}

void bootstrap();
