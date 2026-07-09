import { Injectable } from '@nestjs/common';
import { en } from './en';
import { ru } from './ru';

type Locale = 'ru' | 'en';
type Dictionary = typeof ru;

@Injectable()
export class I18nService {
  private readonly dictionaries: Record<Locale, Dictionary> = { en, ru };

  public get(locale: string | null | undefined): Dictionary {
    return this.dictionaries[this.normalize(locale)];
  }

  public normalize(locale: string | null | undefined): Locale {
    return locale?.toLowerCase().startsWith('en') ? 'en' : 'ru';
  }
}
