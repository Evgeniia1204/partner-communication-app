import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import { DomainError, ERROR_CODES } from '@partner/shared/errors';
import type { CreateCheckInInput } from '@partner/shared/inputs';
import {
  isCommunicationPreferenceKey,
  isIntimacyPreferenceKey,
  isMoodKey,
  isPhysicalStateKey,
  isPleasantActionKey,
} from '@partner/shared/state-options';
import { Context, Markup, Telegraf } from 'telegraf';
import type { Update } from 'telegraf/types';
import { AppConfigService } from '../../../api/src/config/app-config.service';
import { SubmitCheckInUseCase } from '../../../api/src/core/check-ins/submit-check-in.use-case';
import { AcceptPairLinkUseCase } from '../../../api/src/core/couples/accept-pair-link.use-case';
import { CreatePairLinkUseCase } from '../../../api/src/core/couples/create-pair-link.use-case';
import { GetCurrentCoupleUseCase } from '../../../api/src/core/couples/get-current-couple.use-case';
import { GetPartnerForUserUseCase } from '../../../api/src/core/couples/get-partner-for-user.use-case';
import { GetPartnerCurrentCheckInUseCase } from '../../../api/src/core/check-ins/get-partner-current-check-in.use-case';
import { NotificationsService } from '../../../api/src/core/notifications/notifications.service';
import { TelegramUpdatesService } from '../../../api/src/core/telegram-updates/telegram-updates.service';
import { UpdateProfileUseCase } from '../../../api/src/core/users/update-profile.use-case';
import { UpsertTelegramUserUseCase } from '../../../api/src/core/users/upsert-telegram-user.use-case';
import { UsersService } from '../../../api/src/core/users/users.service';
import { DraftService } from '../drafts/draft.service';
import { I18nService } from '../i18n/i18n.service';
import { CheckInKeyboardRenderer } from '../renderers/check-in-keyboard.renderer';
import { MenuRenderer } from '../renderers/menu.renderer';

const PAIR_PAYLOAD_PREFIX = 'pair_';
const DISPLAY_NAME_MAX_LENGTH = 60;
const LANGUAGE_OPTIONS = [
  { label: 'Русский', value: 'ru' },
  { label: 'English', value: 'en' },
] as const;
const TIMEZONE_OPTIONS = [
  { label: 'Европа', value: 'Europe/Berlin' },
  { label: 'Бали / Makassar', value: 'Asia/Makassar' },
  { label: 'Бангкок', value: 'Asia/Bangkok' },
  { label: 'Дубай', value: 'Asia/Dubai' },
  { label: 'Тбилиси', value: 'Asia/Tbilisi' },
  { label: 'Лондон', value: 'Europe/London' },
  { label: 'Нью-Йорк', value: 'America/New_York' },
  { label: 'Лос-Анджелес', value: 'America/Los_Angeles' },
] as const;
const REMINDER_POLL_INTERVAL_MS = 60_000;

@Injectable()
export class TelegramBotService implements OnModuleDestroy {
  private readonly logger = new Logger(TelegramBotService.name);
  private readonly bot: Telegraf;
  private reminderInterval: NodeJS.Timeout | null = null;

  public constructor(
    private readonly config: AppConfigService,
    private readonly upsertTelegramUser: UpsertTelegramUserUseCase,
    private readonly updateProfile: UpdateProfileUseCase,
    private readonly getCurrentCouple: GetCurrentCoupleUseCase,
    private readonly createPairLink: CreatePairLinkUseCase,
    private readonly acceptPairLink: AcceptPairLinkUseCase,
    private readonly getPartnerForUser: GetPartnerForUserUseCase,
    private readonly getPartnerCurrentCheckIn: GetPartnerCurrentCheckInUseCase,
    private readonly submitCheckIn: SubmitCheckInUseCase,
    private readonly notificationsService: NotificationsService,
    private readonly telegramUpdatesService: TelegramUpdatesService,
    private readonly usersService: UsersService,
    private readonly drafts: DraftService,
    private readonly i18n: I18nService,
    private readonly menu: MenuRenderer,
    private readonly checkInKeyboard: CheckInKeyboardRenderer,
  ) {
    this.bot = new Telegraf(this.config.telegramBotToken);
    this.registerHandlers();
    this.bot.catch((error, ctx) => {
      const details = error instanceof Error ? error.stack : String(error);
      this.logger.error(`Telegram handler failed for update ${ctx.update.update_id}`, details);
    });
  }

  public async launch(): Promise<void> {
    await this.bot.telegram.setMyCommands([
      { command: 'menu', description: 'Показать меню' },
      { command: 'checkin', description: 'Обновить состояние' },
      { command: 'partner', description: 'Состояние партнёра' },
      { command: 'pair', description: 'Создать ссылку для пары' },
      { command: 'settings', description: 'Настройки' },
      { command: 'help', description: 'Помощь' },
    ]);
    await this.bot.launch({ dropPendingUpdates: true });
    this.reminderInterval = setInterval(() => {
      void this.sendDueReminders();
    }, REMINDER_POLL_INTERVAL_MS);
  }

  public async onModuleDestroy(): Promise<void> {
    if (this.reminderInterval) {
      clearInterval(this.reminderInterval);
    }
    this.bot.stop();
  }

  public async handleWebhookUpdate(update: Update): Promise<void> {
    await this.bot.handleUpdate(update);
  }

  public async sendDueReminders(): Promise<{ due: number; sent: number; failed: number }> {
    const reminders = await this.notificationsService.findDueReminders(new Date());
    let sent = 0;
    let failed = 0;
    for (const reminder of reminders) {
      const t = this.i18n.get(reminder.locale);
      try {
        await this.bot.telegram.sendMessage(
          reminder.telegramId,
          t.reminders.updateState,
          Markup.inlineKeyboard([[Markup.button.callback(t.menu.updateState, 'checkin:start')]]),
        );
        await this.notificationsService.markReminderSent(reminder);
        sent += 1;
      } catch (error) {
        failed += 1;
        const details = error instanceof Error ? error.stack : String(error);
        this.logger.error(`Reminder delivery failed for user ${reminder.userId}`, details);
        await this.usersService.markBotBlocked(reminder.userId);
      }
    }
    this.logger.log(
      `Reminder run finished: due=${reminders.length}, sent=${sent}, failed=${failed}`,
    );
    return { due: reminders.length, sent, failed };
  }

  private registerHandlers(): void {
    this.bot.use(async (ctx, next) => {
      const update = ctx.update as unknown as Record<string, unknown>;
      const updateType = Object.keys(update).find((key) => key !== 'update_id') ?? 'unknown';
      this.logger.log(`Telegram update ${ctx.update.update_id}: ${updateType}`);
      const shouldProcess = await this.telegramUpdatesService.markProcessed(
        String(ctx.update.update_id),
      );
      if (shouldProcess) {
        await this.upsertCurrentTelegramUser(ctx);
        await next();
      }
    });
    this.bot.start((ctx) => this.handleStart(ctx));
    this.bot.command('menu', (ctx) => this.showMenu(ctx));
    this.bot.command('pair', (ctx) => this.handleCreatePairLink(ctx));
    this.bot.command('checkin', (ctx) => this.startCheckIn(ctx));
    this.bot.command('partner', (ctx) => this.showPartnerState(ctx));
    this.bot.command('settings', (ctx) => this.showSettings(ctx));
    this.bot.command('help', (ctx) => this.showMenu(ctx));
    this.bot.on('callback_query', (ctx) => this.handleCallback(ctx));
    this.bot.on('text', (ctx) => this.handleText(ctx));
  }

  private async handleStart(ctx: Context): Promise<void> {
    const telegramId = this.telegramId(ctx);
    if (!telegramId) {
      return;
    }

    const payload = this.startPayload(ctx);
    const user = await this.upsertCurrentTelegramUser(ctx, payload);
    if (!user) {
      return;
    }

    await this.showLanguageSettings(ctx, payload ? payload : 'start');
  }

  private async acceptPairPayload(
    ctx: Context,
    telegramId: string,
    locale: string,
    payload: string,
  ): Promise<void> {
    const token = payload.slice(PAIR_PAYLOAD_PREFIX.length);
    try {
      const couple = await this.acceptPairLink.execute({ telegramUserId: telegramId, token });
      await this.sendPairCreatedMenu(ctx, couple.partnerA.telegramId, couple.partnerA.locale);
      await this.sendPairCreatedMenu(ctx, couple.partnerB.telegramId, couple.partnerB.locale);
    } catch (error) {
      await ctx.reply(this.renderError(error, locale));
    }
  }

  private async showMenu(ctx: Context): Promise<void> {
    const telegramId = this.telegramId(ctx);
    if (!telegramId) {
      return;
    }
    const user = await this.upsertCurrentTelegramUser(ctx);
    if (!user) {
      return;
    }
    const couple = await this.getCurrentCouple.execute(telegramId);
    const t = this.i18n.get(user.locale);
    await ctx.reply(t.menu.title, this.menu.reply(user.locale, Boolean(couple)));
    await ctx.reply(t.menu.chooseAction, this.menu.main(user.locale, Boolean(couple)));
  }

  private async handleCallback(ctx: Context): Promise<void> {
    const data = this.callbackData(ctx);
    const telegramId = this.telegramId(ctx);
    if (!data || !telegramId) {
      return;
    }
    await ctx.answerCbQuery().catch(() => undefined);

    if (data === 'pair:create_link') {
      await this.handleCreatePairLink(ctx);
      return;
    }
    if (data === 'partner:current') {
      await this.showPartnerState(ctx);
      return;
    }
    if (data === 'settings:main') {
      await this.showSettings(ctx);
      return;
    }
    if (data === 'settings:locale') {
      await this.showLanguageSettings(ctx);
      return;
    }
    if (data.startsWith('settings:locale:')) {
      await this.saveLocale(ctx, data);
      return;
    }
    if (data === 'settings:timezone') {
      await this.showTimezoneSettings(ctx);
      return;
    }
    if (data.startsWith('settings:timezone:')) {
      await this.saveTimezone(ctx, data.replace('settings:timezone:', ''));
      return;
    }
    if (data === 'checkin:start') {
      await this.startCheckIn(ctx);
      return;
    }
    if (data === 'checkin:cancel') {
      await this.drafts.clear(telegramId);
      await this.showMenu(ctx);
      return;
    }
    if (data.startsWith('checkin:')) {
      await this.handleCheckInCallback(ctx, data);
    }
  }

  private async handleCreatePairLink(ctx: Context): Promise<void> {
    const telegramId = this.telegramId(ctx);
    if (!telegramId) {
      return;
    }
    const locale = await this.localeFor(ctx);
    const t = this.i18n.get(locale);
    try {
      const pairLink = await this.createPairLink.execute({ telegramUserId: telegramId });
      await ctx.reply(`${t.pair.linkCreated}\n${pairLink.url}`);
    } catch (error) {
      await ctx.reply(this.renderError(error, locale));
    }
  }

  private async startCheckIn(ctx: Context): Promise<void> {
    const telegramId = this.telegramId(ctx);
    if (!telegramId) {
      return;
    }
    const locale = await this.localeFor(ctx);
    const t = this.i18n.get(locale);
    try {
      await this.getCurrentCouple.execute(telegramId);
      await this.drafts.start(telegramId);
      await ctx.reply(t.checkIn.physical, this.checkInKeyboard.physical(locale));
    } catch (error) {
      await ctx.reply(this.renderError(error, locale));
    }
  }

  private async handleCheckInCallback(ctx: Context, data: string): Promise<void> {
    const telegramId = this.telegramId(ctx);
    if (!telegramId) {
      return;
    }
    const locale = await this.localeFor(ctx);
    const t = this.i18n.get(locale);
    const draft = await this.drafts.get(telegramId);

    if (data.startsWith('checkin:physical:')) {
      const key = data.replace('checkin:physical:', '');
      if (isPhysicalStateKey(key)) {
        draft.physicalStateKey = key;
        await this.drafts.save(telegramId, draft);
        await ctx.reply(t.checkIn.moods, this.checkInKeyboard.moods(locale));
      }
      return;
    }

    if (data.startsWith('checkin:mood:')) {
      const key = data.replace('checkin:mood:', '');
      if (isMoodKey(key)) {
        draft.moodKeys = [key];
        await this.drafts.save(telegramId, draft);
        await ctx.reply(t.checkIn.communication, this.checkInKeyboard.communication(locale));
      }
      return;
    }

    if (data.startsWith('checkin:communication:')) {
      const key = data.replace('checkin:communication:', '');
      if (isCommunicationPreferenceKey(key)) {
        draft.communicationPreferenceKey = key;
        await this.drafts.save(telegramId, draft);
        await ctx.reply(t.checkIn.intimacy, this.checkInKeyboard.intimacy(locale));
      }
      return;
    }

    if (data.startsWith('checkin:intimacy:')) {
      const key = data.replace('checkin:intimacy:', '');
      if (isIntimacyPreferenceKey(key)) {
        draft.intimacyPreferenceKey = key;
        await this.drafts.save(telegramId, draft);
        await ctx.reply(t.checkIn.pleasant, this.checkInKeyboard.pleasant(locale));
      }
      return;
    }

    if (data.startsWith('checkin:pleasant:')) {
      const key = data.replace('checkin:pleasant:', '');
      if (isPleasantActionKey(key)) {
        draft.pleasantActionKeys = [key];
        await this.drafts.save(telegramId, draft);
        await ctx.reply(t.checkIn.comment, this.checkInKeyboard.comment(locale));
      }
      return;
    }

    if (data === 'checkin:comment:add') {
      draft.waitingForComment = true;
      await this.drafts.save(telegramId, draft);
      await ctx.reply(t.checkIn.enterComment);
      return;
    }

    if (data === 'checkin:comment:skip') {
      draft.comment = null;
      await this.drafts.save(telegramId, draft);
      await ctx.reply(t.checkIn.confirm, this.checkInKeyboard.confirm(locale));
      return;
    }

    if (data === 'checkin:confirm') {
      await this.submitDraft(ctx, telegramId, locale);
    }
  }

  private async handleText(ctx: Context): Promise<void> {
    const telegramId = this.telegramId(ctx);
    if (!telegramId || !('text' in ctx.message!)) {
      return;
    }
    const locale = await this.localeFor(ctx);
    const t = this.i18n.get(locale);
    const text = ctx.message.text;
    const user = await this.usersService.findByTelegramId(telegramId);

    if (user?.waitingForDisplayName) {
      await this.saveDisplayName(ctx, text, locale, user.pendingStartPayload);
      return;
    }

    if (text === t.menu.updateState) {
      await this.startCheckIn(ctx);
      return;
    }
    if (text === t.menu.partnerState) {
      await this.showPartnerState(ctx);
      return;
    }
    if (text === t.menu.createPairLink) {
      await this.handleCreatePairLink(ctx);
      return;
    }
    if (text === t.menu.settings) {
      await this.showSettings(ctx);
      return;
    }
    if (text === t.menu.myState) {
      await ctx.reply(t.menu.myStateSoon);
      return;
    }

    const draft = await this.drafts.get(telegramId);
    if (!draft.waitingForComment) {
      return;
    }
    draft.comment = ctx.message.text;
    draft.waitingForComment = false;
    await this.drafts.save(telegramId, draft);
    await ctx.reply(this.i18n.get(locale).checkIn.confirm, this.checkInKeyboard.confirm(locale));
  }

  private async submitDraft(ctx: Context, telegramId: string, locale: string): Promise<void> {
    const draft = await this.drafts.get(telegramId);
    if (
      !draft.physicalStateKey ||
      !draft.communicationPreferenceKey ||
      !draft.intimacyPreferenceKey
    ) {
      await ctx.reply(this.renderError(new Error('Incomplete draft'), locale));
      return;
    }
    const input: CreateCheckInInput = {
      telegramUserId: telegramId,
      physicalStateKey: draft.physicalStateKey,
      moodKeys: draft.moodKeys,
      communicationPreferenceKey: draft.communicationPreferenceKey,
      intimacyPreferenceKey: draft.intimacyPreferenceKey,
      pleasantActionKeys: draft.pleasantActionKeys,
      comment: draft.comment,
    };
    const t = this.i18n.get(locale);
    try {
      await this.submitCheckIn.execute(input);
      await this.drafts.clear(telegramId);
      await ctx.reply(t.checkIn.saved);
      await this.notifyPartnerAboutUpdate(ctx, telegramId, locale);
    } catch (error) {
      await ctx.reply(this.renderError(error, locale));
    }
  }

  private async showPartnerState(ctx: Context): Promise<void> {
    const telegramId = this.telegramId(ctx);
    if (!telegramId) {
      return;
    }
    const locale = await this.localeFor(ctx);
    const t = this.i18n.get(locale);
    try {
      const result = await this.getPartnerCurrentCheckIn.execute(telegramId);
      await ctx.reply(result?.summary ?? t.checkIn.noPartnerState);
    } catch (error) {
      await ctx.reply(this.renderError(error, locale));
    }
  }

  private async sendPairCreatedMenu(
    ctx: Context,
    telegramId: string,
    locale: string,
  ): Promise<void> {
    const t = this.i18n.get(locale);
    await ctx.telegram.sendMessage(telegramId, t.pair.created, this.menu.reply(locale, true));
    await ctx.telegram.sendMessage(telegramId, t.menu.chooseAction, this.menu.main(locale, true));
  }

  private async showSettings(ctx: Context): Promise<void> {
    const locale = await this.localeFor(ctx);
    const t = this.i18n.get(locale);
    await ctx.reply(
      t.settings.title,
      Markup.inlineKeyboard([
        [Markup.button.callback(t.settings.language, 'settings:locale')],
        [Markup.button.callback(t.settings.timezone, 'settings:timezone')],
      ]),
    );
  }

  private async showLanguageSettings(ctx: Context, nextPayload?: string | null): Promise<void> {
    await ctx.reply(
      this.i18n.get('ru').start.chooseLanguage,
      Markup.inlineKeyboard(
        LANGUAGE_OPTIONS.map((language) => [
          Markup.button.callback(
            language.label,
            nextPayload
              ? `settings:locale:${language.value}:${nextPayload}`
              : `settings:locale:${language.value}`,
          ),
        ]),
      ),
    );
  }

  private async saveLocale(ctx: Context, data: string): Promise<void> {
    const telegramId = this.telegramId(ctx);
    if (!telegramId) {
      return;
    }
    const [, , locale, nextPayload] = data.split(':');
    const normalizedLocale = this.i18n.normalize(locale);
    await this.updateProfile.execute({ telegramUserId: telegramId, locale: normalizedLocale });
    const t = this.i18n.get(normalizedLocale);

    if (nextPayload?.startsWith(PAIR_PAYLOAD_PREFIX) || nextPayload === 'start') {
      await this.updateProfile.execute({
        telegramUserId: telegramId,
        waitingForDisplayName: true,
        pendingStartPayload: nextPayload,
      });
      await ctx.reply(t.start.welcome);
      await ctx.reply(t.start.askDisplayName);
      return;
    }

    await ctx.reply(t.settings.languageSaved);
    await this.showSettings(ctx);
  }

  private async saveDisplayName(
    ctx: Context,
    text: string,
    locale: string,
    pendingStartPayload?: string | null,
  ): Promise<void> {
    const telegramId = this.telegramId(ctx);
    if (!telegramId) {
      return;
    }
    const t = this.i18n.get(locale);
    const displayName = text.replace(/\s+/g, ' ').trim().slice(0, DISPLAY_NAME_MAX_LENGTH);
    if (!displayName) {
      await ctx.reply(t.start.askDisplayName);
      return;
    }

    await this.updateProfile.execute({
      telegramUserId: telegramId,
      displayName,
      waitingForDisplayName: false,
      pendingStartPayload: null,
    });
    await ctx.reply(t.start.displayNameSaved.replace('{name}', displayName));

    if (pendingStartPayload?.startsWith(PAIR_PAYLOAD_PREFIX)) {
      await this.acceptPairPayload(ctx, telegramId, locale, pendingStartPayload);
      await this.showTimezoneSettings(ctx);
      return;
    }
    if (pendingStartPayload === 'start') {
      await this.showTimezoneSettings(ctx);
      await this.showMenu(ctx);
      return;
    }

    await this.showMenu(ctx);
  }

  private async showTimezoneSettings(ctx: Context): Promise<void> {
    const locale = await this.localeFor(ctx);
    const t = this.i18n.get(locale);
    await ctx.reply(
      t.start.chooseTimezone,
      Markup.inlineKeyboard(
        TIMEZONE_OPTIONS.map((timezone) => [
          Markup.button.callback(timezone.label, `settings:timezone:${timezone.value}`),
        ]),
      ),
    );
  }

  private async saveTimezone(ctx: Context, timezone: string): Promise<void> {
    const telegramId = this.telegramId(ctx);
    if (!telegramId) {
      return;
    }
    const selectedTimezone = TIMEZONE_OPTIONS.find((option) => option.value === timezone);
    if (!selectedTimezone) {
      await ctx.reply(this.renderError(new Error('Invalid timezone'), await this.localeFor(ctx)));
      return;
    }
    await this.updateProfile.execute({ telegramUserId: telegramId, timezone });
    await ctx.reply(`Часовой пояс: ${selectedTimezone.label}`);
    await this.showMenu(ctx);
  }

  private async notifyPartnerAboutUpdate(
    ctx: Context,
    telegramId: string,
    locale: string,
  ): Promise<void> {
    try {
      const partner = await this.getPartnerForUser.execute(telegramId);
      const preferences = await this.notificationsService.getOrCreateForTelegramUser(
        partner.telegramId,
      );
      if (!preferences.partnerUpdateNotificationsEnabled) {
        return;
      }
      const t = this.i18n.get(partner.locale ?? locale);
      await ctx.telegram.sendMessage(
        partner.telegramId,
        t.checkIn.partnerUpdated,
        Markup.inlineKeyboard([
          [Markup.button.callback(t.menu.partnerState, 'partner:current')],
          [Markup.button.callback(t.menu.updateState, 'checkin:start')],
        ]),
      );
      const partnerView = await this.getPartnerCurrentCheckIn.execute(partner.telegramId);
      if (partnerView?.summary) {
        await ctx.telegram.sendMessage(partner.telegramId, partnerView.summary);
      }
    } catch (error) {
      if (error instanceof DomainError && error.code === ERROR_CODES.COUPLE_NOT_FOUND) {
        return;
      }
      throw error;
    }
  }

  private renderError(error: unknown, locale: string): string {
    const t = this.i18n.get(locale);
    if (error instanceof DomainError) {
      const map: Partial<Record<string, string>> = {
        [ERROR_CODES.PAIR_LINK_EXPIRED]: t.errors.pairExpired,
        [ERROR_CODES.PAIR_LINK_ALREADY_USED]: t.errors.pairUsed,
        [ERROR_CODES.PAIR_LINK_SELF_ACCEPT_FORBIDDEN]: t.errors.selfPair,
        [ERROR_CODES.COUPLE_ALREADY_EXISTS]: t.errors.alreadyPaired,
        [ERROR_CODES.COUPLE_NOT_FOUND]: t.errors.noPair,
      };
      return map[error.code] ?? t.errors.default;
    }
    return t.errors.default;
  }

  private telegramId(ctx: Context): string | null {
    return ctx.from?.id ? String(ctx.from.id) : null;
  }

  private async localeFor(ctx: Context): Promise<string> {
    const telegramId = this.telegramId(ctx);
    if (!telegramId) {
      return this.i18n.normalize(ctx.from?.language_code);
    }
    const user = await this.usersService.findByTelegramId(telegramId);
    return this.i18n.normalize(user?.locale ?? ctx.from?.language_code);
  }

  private callbackData(ctx: Context): string | null {
    const query = ctx.callbackQuery;
    if (query && 'data' in query) {
      return query.data;
    }
    return null;
  }

  private startPayload(ctx: Context): string | null {
    if (!ctx.message || !('text' in ctx.message)) {
      return null;
    }
    const [, payload] = ctx.message.text.split(' ');
    return payload ?? null;
  }

  private async upsertCurrentTelegramUser(ctx: Context, startPayload?: string | null) {
    const telegramId = this.telegramId(ctx);
    if (!telegramId) {
      return null;
    }
    return this.upsertTelegramUser.execute({
      telegramId,
      username: ctx.from?.username,
      firstName: ctx.from?.first_name,
      lastName: ctx.from?.last_name,
      languageCode: ctx.from?.language_code,
      startPayload,
    });
  }
}
