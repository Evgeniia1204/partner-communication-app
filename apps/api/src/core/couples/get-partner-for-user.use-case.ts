import { Injectable } from '@nestjs/common';
import { CouplesService } from './couples.service';

@Injectable()
export class GetPartnerForUserUseCase {
  public constructor(private readonly couplesService: CouplesService) {}

  public async execute(telegramUserId: string) {
    return this.couplesService.getPartnerForTelegramUser(telegramUserId);
  }
}
