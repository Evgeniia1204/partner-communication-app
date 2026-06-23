import { Injectable } from '@nestjs/common';
import type { UpdateProfileInput } from '@partner/shared/inputs';
import { UsersService } from './users.service';

@Injectable()
export class UpdateProfileUseCase {
  public constructor(private readonly usersService: UsersService) {}

  public async execute(input: UpdateProfileInput) {
    return this.usersService.updateProfile(input);
  }
}
