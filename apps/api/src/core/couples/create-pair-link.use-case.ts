import { Injectable } from '@nestjs/common';
import type { CreatePairLinkInput } from '@partner/shared/inputs';
import { CouplesService } from './couples.service';

@Injectable()
export class CreatePairLinkUseCase {
  public constructor(private readonly couplesService: CouplesService) {}

  public async execute(input: CreatePairLinkInput): Promise<{ token: string; url: string }> {
    return this.couplesService.createPairLink(input);
  }
}
