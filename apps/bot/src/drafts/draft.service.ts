import { Injectable } from '@nestjs/common';
import { CHECK_IN_DRAFT_TTL_SECONDS } from '@partner/shared/constants';
import { DomainError, ERROR_CODES } from '@partner/shared/errors';
import {
  isCommunicationPreferenceKey,
  isIntimacyPreferenceKey,
  isMoodKey,
  isPhysicalStateKey,
  isPleasantActionKey,
} from '@partner/shared/state-options';
import { PrismaService } from '../../../api/src/prisma/prisma.service';
import { CheckInDraft, createEmptyCheckInDraft } from './check-in-draft';

@Injectable()
export class DraftService {
  public constructor(private readonly prisma: PrismaService) {}

  public async start(telegramId: string): Promise<CheckInDraft> {
    const draft = createEmptyCheckInDraft();
    await this.save(telegramId, draft);
    return draft;
  }

  public async get(telegramId: string): Promise<CheckInDraft> {
    const user = await this.getUser(telegramId);
    const draft = await this.prisma.checkInDraft.findUnique({
      where: { userId: user.id },
    });
    if (!draft || draft.expiresAt.getTime() < Date.now()) {
      return createEmptyCheckInDraft();
    }
    return {
      physicalStateKey:
        draft.physicalStateKey && isPhysicalStateKey(draft.physicalStateKey)
          ? draft.physicalStateKey
          : undefined,
      moodKeys: draft.moodKeys.filter(isMoodKey),
      communicationPreferenceKey:
        draft.communicationPreferenceKey &&
        isCommunicationPreferenceKey(draft.communicationPreferenceKey)
          ? draft.communicationPreferenceKey
          : undefined,
      intimacyPreferenceKey:
        draft.intimacyPreferenceKey && isIntimacyPreferenceKey(draft.intimacyPreferenceKey)
          ? draft.intimacyPreferenceKey
          : undefined,
      pleasantActionKeys: draft.pleasantActionKeys.filter(isPleasantActionKey),
      waitingForComment: draft.waitingForComment,
      comment: draft.comment,
    };
  }

  public async save(telegramId: string, draft: CheckInDraft): Promise<void> {
    const user = await this.getUser(telegramId);
    const expiresAt = new Date(Date.now() + CHECK_IN_DRAFT_TTL_SECONDS * 1000);
    await this.prisma.checkInDraft.upsert({
      where: { userId: user.id },
      create: {
        userId: user.id,
        physicalStateKey: draft.physicalStateKey,
        moodKeys: draft.moodKeys,
        communicationPreferenceKey: draft.communicationPreferenceKey,
        intimacyPreferenceKey: draft.intimacyPreferenceKey,
        pleasantActionKeys: draft.pleasantActionKeys,
        waitingForComment: draft.waitingForComment,
        comment: draft.comment,
        expiresAt,
      },
      update: {
        physicalStateKey: draft.physicalStateKey,
        moodKeys: draft.moodKeys,
        communicationPreferenceKey: draft.communicationPreferenceKey,
        intimacyPreferenceKey: draft.intimacyPreferenceKey,
        pleasantActionKeys: draft.pleasantActionKeys,
        waitingForComment: draft.waitingForComment,
        comment: draft.comment,
        expiresAt,
      },
    });
  }

  public async clear(telegramId: string): Promise<void> {
    const user = await this.getUser(telegramId);
    await this.prisma.checkInDraft.deleteMany({ where: { userId: user.id } });
  }

  private async getUser(telegramId: string) {
    const user = await this.prisma.user.findUnique({ where: { telegramId } });
    if (!user) {
      throw new DomainError(ERROR_CODES.TELEGRAM_USER_NOT_FOUND, 'Telegram user not found');
    }
    return user;
  }
}
