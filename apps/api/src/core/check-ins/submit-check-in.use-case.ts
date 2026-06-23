import { Injectable } from '@nestjs/common';
import type { CreateCheckInInput } from '@partner/shared/inputs';
import { CheckInsService } from './check-ins.service';

@Injectable()
export class SubmitCheckInUseCase {
  public constructor(private readonly checkInsService: CheckInsService) {}

  public async execute(input: CreateCheckInInput) {
    return this.checkInsService.submit(input);
  }
}
