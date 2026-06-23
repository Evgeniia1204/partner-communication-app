import { Module } from '@nestjs/common';
import { StateOptionsService } from './state-options.service';

@Module({
  providers: [StateOptionsService],
  exports: [StateOptionsService],
})
export class StateOptionsModule {}
