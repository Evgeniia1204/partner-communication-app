import { Module } from '@nestjs/common';
import { UsersModule } from '../users/users.module';
import { AcceptPairLinkUseCase } from './accept-pair-link.use-case';
import { CouplesService } from './couples.service';
import { CreatePairLinkUseCase } from './create-pair-link.use-case';
import { GetCurrentCoupleUseCase } from './get-current-couple.use-case';
import { GetPartnerForUserUseCase } from './get-partner-for-user.use-case';
import { TokenService } from './token.service';

@Module({
  imports: [UsersModule],
  providers: [
    CouplesService,
    TokenService,
    CreatePairLinkUseCase,
    AcceptPairLinkUseCase,
    GetCurrentCoupleUseCase,
    GetPartnerForUserUseCase,
  ],
  exports: [
    CouplesService,
    CreatePairLinkUseCase,
    AcceptPairLinkUseCase,
    GetCurrentCoupleUseCase,
    GetPartnerForUserUseCase,
  ],
})
export class CouplesModule {}
