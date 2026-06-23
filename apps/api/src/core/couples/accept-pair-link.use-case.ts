import { Injectable } from '@nestjs/common';
import type { AcceptPairLinkInput } from '@partner/shared/inputs';
import { CouplesService } from './couples.service';

@Injectable()
export class AcceptPairLinkUseCase {
  public constructor(private readonly couplesService: CouplesService) {}

  public async execute(input: AcceptPairLinkInput) {
    return this.couplesService.acceptPairLink(input);
  }
}
