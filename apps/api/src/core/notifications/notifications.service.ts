import { Injectable } from '@nestjs/common';
import {
  DEFAULT_FIRST_HALF_OF_DAY_TIME,
  DEFAULT_SECOND_HALF_OF_DAY_TIME,
} from '@partner/shared/constants';
import { DomainError, ERROR_CODES } from '@partner/shared/errors';
import type { UpdateNotificationPreferencesInput } from '@partner/shared/inputs';
import { PrismaService } from '../../prisma/prisma.service';

const TIME_PATTERN = /^([01]\d|2[0-3]):[0-5]\d$/;
const FIRST_HALF_PERIOD = 'firstHalfOfDay';
const SECOND_HALF_PERIOD = 'secondHalfOfDay';

interface DueReminder {
  userId: string;
  telegramId: string;
  locale: string;
  period: typeof FIRST_HALF_PERIOD | typeof SECOND_HALF_PERIOD;
  localDate: string;
}

@Injectable()
export class NotificationsService {
  public constructor(private readonly prisma: PrismaService) {}

  public async getOrCreateForTelegramUser(telegramId: string) {
    const user = await this.prisma.user.findUnique({ where: { telegramId } });
    if (!user) {
      throw new DomainError(ERROR_CODES.TELEGRAM_USER_NOT_FOUND, 'Telegram user not found');
    }

    return this.prisma.notificationPreference.upsert({
      where: { userId: user.id },
      create: {
        userId: user.id,
        firstHalfOfDayEnabled: true,
        firstHalfOfDayTime: DEFAULT_FIRST_HALF_OF_DAY_TIME,
        secondHalfOfDayEnabled: true,
        secondHalfOfDayTime: DEFAULT_SECOND_HALF_OF_DAY_TIME,
        partnerUpdateNotificationsEnabled: true,
      },
      update: {},
    });
  }

  public async update(input: UpdateNotificationPreferencesInput) {
    this.assertValidTime(input.firstHalfOfDayTime);
    this.assertValidTime(input.secondHalfOfDayTime);

    const preference = await this.getOrCreateForTelegramUser(input.telegramUserId);

    return this.prisma.notificationPreference.update({
      where: { id: preference.id },
      data: {
        firstHalfOfDayEnabled: input.firstHalfOfDayEnabled,
        firstHalfOfDayTime: input.firstHalfOfDayTime,
        secondHalfOfDayEnabled: input.secondHalfOfDayEnabled,
        secondHalfOfDayTime: input.secondHalfOfDayTime,
        partnerUpdateNotificationsEnabled: input.partnerUpdateNotificationsEnabled,
      },
    });
  }

  public async findDueReminders(now: Date): Promise<DueReminder[]> {
    const preferences = await this.prisma.notificationPreference.findMany({
      where: {
        user: {
          deletedAt: null,
          isBotBlocked: false,
        },
        OR: [{ firstHalfOfDayEnabled: true }, { secondHalfOfDayEnabled: true }],
      },
      include: { user: true },
    });

    const due: DueReminder[] = [];
    for (const preference of preferences) {
      const local = this.getLocalDateTime(now, preference.user.timezone);
      const candidates = [
        {
          enabled: preference.firstHalfOfDayEnabled,
          time: preference.firstHalfOfDayTime,
          period: FIRST_HALF_PERIOD,
        },
        {
          enabled: preference.secondHalfOfDayEnabled,
          time: preference.secondHalfOfDayTime,
          period: SECOND_HALF_PERIOD,
        },
      ] as const;

      for (const candidate of candidates) {
        if (!candidate.enabled || candidate.time !== local.time) {
          continue;
        }
        const alreadySent = await this.prisma.reminderDeliveryLog.findUnique({
          where: {
            userId_period_localDate: {
              userId: preference.userId,
              period: candidate.period,
              localDate: local.date,
            },
          },
        });
        if (!alreadySent) {
          due.push({
            userId: preference.userId,
            telegramId: preference.user.telegramId,
            locale: preference.user.locale,
            period: candidate.period,
            localDate: local.date,
          });
        }
      }
    }
    return due;
  }

  public async markReminderSent(reminder: DueReminder): Promise<void> {
    await this.prisma.reminderDeliveryLog.upsert({
      where: {
        userId_period_localDate: {
          userId: reminder.userId,
          period: reminder.period,
          localDate: reminder.localDate,
        },
      },
      create: {
        userId: reminder.userId,
        period: reminder.period,
        localDate: reminder.localDate,
      },
      update: {},
    });
  }

  private assertValidTime(value: string | undefined): void {
    if (value !== undefined && !TIME_PATTERN.test(value)) {
      throw new DomainError(ERROR_CODES.NOTIFICATION_INVALID_TIME, 'Invalid notification time');
    }
  }

  private getLocalDateTime(now: Date, timezone: string): { date: string; time: string } {
    const parts = new Intl.DateTimeFormat('en-CA', {
      timeZone: timezone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hourCycle: 'h23',
    }).formatToParts(now);
    const value = (type: string): string => parts.find((part) => part.type === type)?.value ?? '';
    return {
      date: `${value('year')}-${value('month')}-${value('day')}`,
      time: `${value('hour')}:${value('minute')}`,
    };
  }
}
