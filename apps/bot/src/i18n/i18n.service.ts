import { Injectable } from '@nestjs/common';
import { ru } from './ru';

type Locale = 'ru';
type Dictionary = typeof ru;

@Injectable()
export class I18nService {
  private readonly dictionaries: Record<Locale, Dictionary> = { ru };

  public get(locale: string | null | undefined): Dictionary {
    return this.dictionaries[this.normalize(locale)];
  }

  public normalize(_locale: string | null | undefined): Locale {
    return 'ru';
  }
}
