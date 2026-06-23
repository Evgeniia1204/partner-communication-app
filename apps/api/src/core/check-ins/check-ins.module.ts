import { Module } from '@nestjs/common';
import { CouplesModule } from '../couples/couples.module';
import { UsersModule } from '../users/users.module';
import { CheckInsService } from './check-ins.service';
import { GetMyCurrentCheckInUseCase } from './get-my-current-check-in.use-case';
import { GetPartnerCurrentCheckInUseCase } from './get-partner-current-check-in.use-case';
import { SubmitCheckInUseCase } from './submit-check-in.use-case';

@Module({
  imports: [CouplesModule, UsersModule],
  providers: [
    CheckInsService,
    SubmitCheckInUseCase,
    GetMyCurrentCheckInUseCase,
    GetPartnerCurrentCheckInUseCase,
  ],
  exports: [
    CheckInsService,
    SubmitCheckInUseCase,
    GetMyCurrentCheckInUseCase,
    GetPartnerCurrentCheckInUseCase,
  ],
})
export class CheckInsModule {}
