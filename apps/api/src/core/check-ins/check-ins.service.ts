import { Injectable } from '@nestjs/common';
import {
  CHECK_IN_COMMENT_MAX_LENGTH,
  MAX_SELECTIONS_PER_CHECK_IN_BLOCK,
} from '@partner/shared/constants';
import { DomainError, ERROR_CODES } from '@partner/shared/errors';
import type { CreateCheckInInput } from '@partner/shared/inputs';
import {
  isCommunicationPreferenceKey,
  isIntimacyPreferenceKey,
  isMoodKey,
  isPhysicalStateKey,
  isPleasantActionKey,
  type CommunicationPreferenceKey,
  type IntimacyPreferenceKey,
  type MoodKey,
  type PhysicalStateKey,
  type PleasantActionKey,
} from '@partner/shared/state-options';
import { PrismaService } from '../../prisma/prisma.service';
import { CouplesService } from '../couples/couples.service';
import { UsersService } from '../users/users.service';
import { CheckInSummaryService } from './check-in-summary.service';

@Injectable()
export class CheckInsService {
  private readonly summary = new CheckInSummaryService();

  public constructor(
    private readonly prisma: PrismaService,
    private readonly usersService: UsersService,
    private readonly couplesService: CouplesService,
  ) {}

  public async submit(input: CreateCheckInInput) {
    this.validateInput(input);

    const user = await this.usersService.findByTelegramId(input.telegramUserId);
    if (!user) {
      throw new DomainError(ERROR_CODES.TELEGRAM_USER_NOT_FOUND, 'Telegram user not found');
    }
    const couple = await this.couplesService.requireCurrentCoupleByTelegramId(input.telegramUserId);

    return this.prisma.checkIn.create({
      data: {
        userId: user.id,
        coupleId: couple.id,
        physicalStateKey: input.physicalStateKey,
        communicationPreferenceKey: input.communicationPreferenceKey,
        intimacyPreferenceKey: input.intimacyPreferenceKey,
        comment: input.comment?.slice(0, CHECK_IN_COMMENT_MAX_LENGTH) ?? null,
        moods: {
          createMany: {
            data: input.moodKeys.map((moodKey) => ({ moodKey })),
          },
        },
        pleasantActions: {
          createMany: {
            data: input.pleasantActionKeys.map((pleasantActionKey) => ({ pleasantActionKey })),
          },
        },
      },
      include: {
        user: true,
        moods: true,
        pleasantActions: true,
      },
    });
  }

  public async getMyCurrent(telegramUserId: string) {
    const user = await this.usersService.findByTelegramId(telegramUserId);
    if (!user) {
      throw new DomainError(ERROR_CODES.TELEGRAM_USER_NOT_FOUND, 'Telegram user not found');
    }
    return this.findLatestForUser(user.id);
  }

  public async getPartnerCurrent(telegramUserId: string) {
    const partner = await this.couplesService.getPartnerForTelegramUser(telegramUserId);
    const checkIn = await this.findLatestForUser(partner.id);
    if (!checkIn) {
      return null;
    }
    return {
      checkIn,
      summary: this.summary.build({
        displayName: partner.displayName,
        physicalStateKey: checkIn.physicalStateKey as PhysicalStateKey,
        moodKeys: checkIn.moods.map((mood) => mood.moodKey as MoodKey),
        communicationPreferenceKey:
          checkIn.communicationPreferenceKey as CommunicationPreferenceKey,
        intimacyPreferenceKey: checkIn.intimacyPreferenceKey as IntimacyPreferenceKey,
        pleasantActionKeys: checkIn.pleasantActions.map(
          (action) => action.pleasantActionKey as PleasantActionKey,
        ),
        comment: checkIn.comment,
      }),
    };
  }

  private async findLatestForUser(userId: string) {
    return this.prisma.checkIn.findFirst({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      include: {
        user: true,
        moods: true,
        pleasantActions: true,
      },
    });
  }

  private validateInput(input: CreateCheckInInput): void {
    if (!isPhysicalStateKey(input.physicalStateKey)) {
      throw new DomainError(ERROR_CODES.CHECK_IN_INVALID_OPTION, 'Invalid physical state');
    }
    if (input.moodKeys.length > MAX_SELECTIONS_PER_CHECK_IN_BLOCK) {
      throw new DomainError(ERROR_CODES.CHECK_IN_TOO_MANY_MOODS, 'Too many moods');
    }
    if (!input.moodKeys.every(isMoodKey)) {
      throw new DomainError(ERROR_CODES.CHECK_IN_INVALID_OPTION, 'Invalid mood');
    }
    if (!isCommunicationPreferenceKey(input.communicationPreferenceKey)) {
      throw new DomainError(ERROR_CODES.CHECK_IN_INVALID_OPTION, 'Invalid communication option');
    }
    if (!isIntimacyPreferenceKey(input.intimacyPreferenceKey)) {
      throw new DomainError(ERROR_CODES.CHECK_IN_INVALID_OPTION, 'Invalid intimacy option');
    }
    if (input.pleasantActionKeys.length > MAX_SELECTIONS_PER_CHECK_IN_BLOCK) {
      throw new DomainError(ERROR_CODES.CHECK_IN_INVALID_OPTION, 'Too many pleasant actions');
    }
    if (!input.pleasantActionKeys.every(isPleasantActionKey)) {
      throw new DomainError(ERROR_CODES.CHECK_IN_INVALID_OPTION, 'Invalid pleasant action');
    }
  }
}
