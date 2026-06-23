import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getTelegramBotService } from '../_bot-app';

export default async function handler(
  request: VercelRequest,
  response: VercelResponse,
): Promise<void> {
  if (request.method !== 'GET' && request.method !== 'POST') {
    response.setHeader('Allow', 'GET, POST');
    response.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const bot = await getTelegramBotService();
  await bot.sendDueReminders();
  response.status(200).json({ ok: true });
}
