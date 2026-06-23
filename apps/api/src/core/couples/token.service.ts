import { Injectable } from '@nestjs/common';
import { createHash, randomBytes } from 'node:crypto';

@Injectable()
export class TokenService {
  public createToken(): string {
    return randomBytes(24).toString('base64url');
  }

  public hashToken(token: string): string {
    return createHash('sha256').update(token).digest('hex');
  }
}
