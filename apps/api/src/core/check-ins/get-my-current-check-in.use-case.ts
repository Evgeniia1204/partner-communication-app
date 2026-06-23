import { Injectable } from '@nestjs/common';
import { CheckInsService } from './check-ins.service';

@Injectable()
export class GetMyCurrentCheckInUseCase {
  public constructor(private readonly checkInsService: CheckInsService) {}

  public async execute(telegramUserId: string) {
    return this.checkInsService.getMyCurrent(telegramUserId);
  }
}
