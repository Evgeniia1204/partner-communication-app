import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class TelegramUpdatesService {
  public constructor(private readonly prisma: PrismaService) {}

  public async markProcessed(telegramUpdateId: string): Promise<boolean> {
    try {
      await this.prisma.telegramUpdateLog.create({
        data: {
          telegramUpdateId,
          processedAt: new Date(),
        },
      });
      return true;
    } catch {
      return false;
    }
  }
}
