import { Injectable } from '@nestjs/common';
import { DomainError, ERROR_CODES } from '@partner/shared/errors';
import type { AcceptPairLinkInput, CreatePairLinkInput } from '@partner/shared/inputs';
import { AppConfigService } from '../../config/app-config.service';
import { PrismaService } from '../../prisma/prisma.service';
import { UsersService } from '../users/users.service';
import { TokenService } from './token.service';

@Injectable()
export class CouplesService {
  public constructor(
    private readonly prisma: PrismaService,
    private readonly usersService: UsersService,
    private readonly tokens: TokenService,
    private readonly config: AppConfigService,
  ) {}

  public async createPairLink(input: CreatePairLinkInput): Promise<{ token: string; url: string }> {
    const creator = await this.requireUser(input.telegramUserId);
    await this.assertNoActiveCouple(creator.id);

    const token = this.tokens.createToken();
    const tokenHash = this.tokens.hashToken(token);
    const expiresAt = new Date(Date.now() + this.config.pairLinkTtlMinutes * 60_000);

    await this.prisma.pairLink.create({
      data: {
        creatorId: creator.id,
        tokenHash,
        expiresAt,
      },
    });

    return {
      token,
      url: `https://t.me/${this.config.telegramBotUsername}?start=pair_${token}`,
    };
  }

  public async acceptPairLink(input: AcceptPairLinkInput) {
    const acceptedBy = await this.requireUser(input.telegramUserId);
    await this.assertNoActiveCouple(acceptedBy.id);

    const pairLink = await this.prisma.pairLink.findUnique({
      where: { tokenHash: this.tokens.hashToken(input.token) },
      include: { creator: true },
    });

    if (!pairLink) {
      throw new DomainError(ERROR_CODES.PAIR_LINK_NOT_FOUND, 'Pair link not found');
    }
    if (pairLink.acceptedAt) {
      throw new DomainError(ERROR_CODES.PAIR_LINK_ALREADY_USED, 'Pair link already used');
    }
    if (pairLink.expiresAt.getTime() < Date.now()) {
      throw new DomainError(ERROR_CODES.PAIR_LINK_EXPIRED, 'Pair link expired');
    }
    if (pairLink.creatorId === acceptedBy.id) {
      throw new DomainError(ERROR_CODES.PAIR_LINK_SELF_ACCEPT_FORBIDDEN, 'Cannot pair with self');
    }

    await this.assertNoActiveCouple(pairLink.creatorId);

    return this.prisma.$transaction(async (tx) => {
      const updatedPairLink = await tx.pairLink.update({
        where: { id: pairLink.id },
        data: {
          acceptedById: acceptedBy.id,
          acceptedAt: new Date(),
        },
      });

      return tx.couple.create({
        data: {
          partnerAId: pairLink.creatorId,
          partnerBId: acceptedBy.id,
          createdByPairLinkId: updatedPairLink.id,
        },
        include: {
          partnerA: true,
          partnerB: true,
        },
      });
    });
  }

  public async getCurrentCoupleByTelegramId(telegramUserId: string) {
    const user = await this.requireUser(telegramUserId);
    return this.getCurrentCoupleByUserId(user.id);
  }

  public async getPartnerForTelegramUser(telegramUserId: string) {
    const user = await this.requireUser(telegramUserId);
    const couple = await this.getCurrentCoupleByUserId(user.id);
    if (!couple) {
      throw new DomainError(ERROR_CODES.COUPLE_NOT_FOUND, 'Couple not found');
    }
    return couple.partnerAId === user.id ? couple.partnerB : couple.partnerA;
  }

  public async requireCurrentCoupleByTelegramId(telegramUserId: string) {
    const couple = await this.getCurrentCoupleByTelegramId(telegramUserId);
    if (!couple) {
      throw new DomainError(ERROR_CODES.COUPLE_NOT_FOUND, 'Couple not found');
    }
    return couple;
  }

  private async requireUser(telegramUserId: string) {
    const user = await this.usersService.findByTelegramId(telegramUserId);
    if (!user) {
      throw new DomainError(ERROR_CODES.TELEGRAM_USER_NOT_FOUND, 'Telegram user not found');
    }
    return user;
  }

  private async getCurrentCoupleByUserId(userId: string) {
    return this.prisma.couple.findFirst({
      where: {
        endedAt: null,
        OR: [{ partnerAId: userId }, { partnerBId: userId }],
      },
      include: {
        partnerA: true,
        partnerB: true,
      },
    });
  }

  private async assertNoActiveCouple(userId: string): Promise<void> {
    const couple = await this.getCurrentCoupleByUserId(userId);
    if (couple) {
      throw new DomainError(ERROR_CODES.COUPLE_ALREADY_EXISTS, 'Active couple already exists');
    }
  }
}
