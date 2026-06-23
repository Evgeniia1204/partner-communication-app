import type { VercelRequest, VercelResponse } from '@vercel/node';
import type { Update } from 'telegraf/types';
import { getTelegramBotService } from '../_bot-app';

export default async function handler(
  request: VercelRequest,
  response: VercelResponse,
): Promise<void> {
  if (request.method !== 'POST') {
    response.setHeader('Allow', 'POST');
    response.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const expectedSecret = process.env.TELEGRAM_WEBHOOK_SECRET;
  if (expectedSecret) {
    const actualSecret = request.headers['x-telegram-bot-api-secret-token'];
    if (actualSecret !== expectedSecret) {
      response.status(401).json({ error: 'Unauthorized' });
      return;
    }
  }

  const bot = await getTelegramBotService();
  await bot.handleWebhookUpdate(request.body as Update);
  response.status(200).json({ ok: true });
}
