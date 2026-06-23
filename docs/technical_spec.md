# Техническая спецификация MVP Telegram-бота

## 1. Назначение документа

Документ описывает техническую реализацию MVP Telegram-бота для пар, который помогает быстро передавать партнёру текущее состояние, потребности и готовность к контакту.

Спецификация основана на:

- продуктовой спецификации `docs/couple_app_mvp_spec.md`;
- инженерных правилах из `CLAUDE.MD`;
- решении делать первую версию как Telegram-бот, а не мобильное или web-приложение.

## 2. Цель MVP

Сделать минимальный, но завершённый Telegram-бот, в котором два равноправных партнёра могут:

- начать пользоваться ботом через Telegram;
- создать общую пару-связку через ссылку;
- быстро обновлять своё состояние через готовые варианты;
- видеть актуальное состояние партнёра в понятной сводке;
- получать ненавязчивые Telegram-напоминания в первой и второй половине дня.

MVP не включает чат внутри продукта, дневник, аналитику отношений, графики, геймификацию, ИИ-консультации, психологические рекомендации, мобильное приложение и отдельную web-панель.

## 3. Основные продуктовые принципы

- Пользователь выбирает, а не формулирует.
- Чек-ин должен занимать 20-30 секунд.
- Передача контекста важнее идеальной точности.
- Оба партнёра абсолютно равноправны.
- Бот не является каналом общения вместо пары, а только передаёт текущий контекст.
- Продукт не интерпретирует состояние пользователя и не даёт советов.

## 4. Что означает равноправная пара

В продукте нет роли "пригласивший" и "приглашённый" после создания пары.

Пользователь, который первым создал ссылку, технически является `creator` только для аудита и защиты токена. Это не даёт дополнительных функций.

После связывания оба участника могут одинаково:

- проходить чек-ин;
- смотреть состояние партнёра;
- менять свои настройки;
- получать напоминания;
- инициировать обновление своей информации.

Пара создаётся не как подписка одного пользователя на другого, а как симметричная связь двух Telegram-пользователей.

## 5. Технологический стек

### 5.1 Monorepo

Проект реализуется как monorepo на Turborepo.

```text
apps/
  api/
  bot/
  docs/
packages/
  shared/
```

### 5.2 Backend

- Node.js.
- TypeScript.
- NestJS.
- Prisma ORM.
- PostgreSQL.
- PostgreSQL для бизнес-данных, draft-состояний, логов напоминаний и защиты от повторной обработки update.
- Swagger на `/api/docs` только для внутренней API-документации.
- Деплой на Railway.

### 5.3 Telegram bot

- Telegram Bot API.
- Telegraf или nestjs-telegraf как транспортный слой.
- Inline keyboards для выбора вариантов.
- Deep links для создания пары: `/start pair_<token>`.
- Telegram messages для напоминаний.

### 5.4 Инструменты

- Только `yarn` berry.
- ESLint + Prettier.
- Jest для backend и bot unit-тестов.
- E2E-тесты use-cases без реального Telegram API.

## 6. Архитектура

### 6.1 Слои

```text
Transport
  Telegram scenes/handlers, internal HTTP controllers

Core
  Use-cases, domain services

Domain
  Entities, value objects, domain rules

Infrastructure
  Prisma, PostgreSQL, Telegram client, schedulers
```

Правила:

- Telegram handlers тонкие: разобрать update, вызвать use-case, отформатировать ответ.
- Бизнес-логика не находится в Telegram scenes/handlers.
- Новый код оформляется через use-cases.
- Infrastructure доступна core-слою через ports.
- Prisma не вызывается напрямую из transport.
- `forwardRef` избегается, зависимости выносятся в отдельные модули.
- Barrel exports не используются.
- Path aliases обязательны.

### 6.2 Path aliases

```json
{
  "@core/*": ["src/core/*"],
  "@transport/*": ["src/transport/*"],
  "@integrations/*": ["src/integrations/*"],
  "@shared/*": ["src/shared/*"],
  "@prisma/*": ["src/prisma/*"],
  "@config/*": ["src/config/*"],
  "@notifications/*": ["src/notifications/*"],
  "@telegram/*": ["src/telegram/*"]
}
```

## 7. Пользовательские роли

### 7.1 Telegram user

Обычный пользователь бота.

Может:

- запустить бота;
- создать pair-link;
- присоединиться к pair-link партнёра;
- обновлять свой чек-ин;
- видеть текущий чек-ин партнёра;
- настроить язык, timezone и напоминания.

### 7.2 Partner

Не отдельная роль в системе, а второй равноправный пользователь в активной сущности `Couple`.

### 7.3 Admin

В пользовательском MVP роли admin нет.

Отдельный административный пользователь не нужен, потому что:

- бот не требует ручной модерации на старте;
- нет контентной ленты;
- нет платёжных операций;
- нет пользовательских отчётов или поддержки внутри MVP.

Если позже понадобится поддержка, admin может появиться как отдельный внутренний инструмент для диагностики: посмотреть технический статус пользователя, найти пару по Telegram ID, отключить сломанные напоминания, посмотреть ошибки доставки. В MVP это не реализуется и не проектируется как пользовательская роль.

## 8. Основные сценарии

### 8.1 Первый запуск бота

1. Пользователь открывает Telegram-бота.
2. Нажимает Start.
3. Бот получает Telegram `id`, `username`, `first_name`, `last_name`, `language_code`.
4. Backend создаёт или обновляет `User`.
5. Бот показывает главное меню:
   - создать пару;
   - присоединиться по ссылке, если пользователь пришёл через deep link;
   - обновить состояние, если пара уже есть;
   - посмотреть состояние партнёра, если пара уже есть.

### 8.2 Создание равноправной пары через pair-link

1. Первый пользователь нажимает "Создать пару".
2. Backend создаёт одноразовый `PairLink` с TTL.
3. Бот возвращает deep link вида `https://t.me/<bot_username>?start=pair_<token>`.
4. Пользователь отправляет ссылку партнёру в Telegram любым удобным способом.
5. Партнёр открывает ссылку и нажимает Start.
6. Backend проверяет token, создаёт `Couple` и связывает двух пользователей.
7. Pair-link становится использованным.
8. Оба пользователя получают сообщение, что пара создана.
9. Дальше оба имеют одинаковые функции.
10. После создания пары ссылка больше не нужна: каждый партнёр ежедневно пользуется ботом напрямую через меню, команды или кнопки в напоминаниях.

Ограничения:

- один пользователь может состоять только в одной активной паре;
- нельзя создать пару с самим собой;
- pair-link имеет TTL;
- использованный pair-link нельзя применить повторно;
- pair-link не даёт владельцу дополнительных прав после создания пары.
- pair-link используется только один раз для связывания пары, а не для ежедневного входа в продукт.

### 8.3 Ежедневное использование после связывания

После создания пары оба пользователя остаются зарегистрированными Telegram-пользователями бота.

Для ежедневного использования им не нужно каждый раз переходить по pair-link. Пользователь просто открывает тот же Telegram-бот и выбирает нужное действие:

- "Обновить состояние";
- "Состояние партнёра";
- "Моё последнее состояние";
- "Настройки".

Напоминания тоже ведут не на pair-link, а на обычное действие обновления состояния внутри уже связанного бота.

### 8.4 Альтернатива без "приглашённого" ощущения

В интерфейсе не используется формулировка "пригласить партнёра" как основной термин.

Рекомендуемые тексты:

- "Создать ссылку для пары";
- "Подключиться к паре";
- "Связать нас в пару";
- "Пара создана. Теперь вы оба можете обновлять состояние и видеть статус друг друга".

Технически ссылка всё равно одноразовая, но продуктово это не иерархичный invite, а общий вход в одну пару.

### 8.5 Создание чек-ина

1. Пользователь нажимает "Обновить состояние".
2. Бот последовательно показывает пять блоков:
   - физическое состояние;
   - настроение;
   - готовность к коммуникации;
   - близость;
   - что было бы приятно.
3. Пользователь выбирает один вариант в каждом блоке через inline keyboard.
4. После выбора бот сразу показывает следующий вопрос, без кнопок "Готово" и "Дальше".
5. Свободный комментарий необязателен и доступен отдельным действием.
6. Пользователь подтверждает чек-ин.
7. Backend валидирует выборы и сохраняет новую версию чек-ина.
8. Бот показывает пользователю краткое подтверждение.
9. Партнёр получает ненавязчивое сообщение, что состояние обновлено, если такие уведомления включены.

### 8.6 Просмотр состояния партнёра

1. Пользователь нажимает "Состояние партнёра".
2. Backend получает актуальный чек-ин второго участника активной пары.
3. Бот показывает понятную сводку человеческим языком.
4. Если чек-ина нет, бот показывает нейтральное пустое состояние.

Пример:

```text
Сейчас Женя немного устала, чувствует себя спокойно, предпочитает переписываться и была бы рада поддержке.
```

### 8.7 Напоминания

1. У каждого пользователя есть собственные настройки напоминаний.
2. По умолчанию включена одна точка: 10:00 в локальном timezone пользователя.
3. Время считается в timezone пользователя.
4. Бот отправляет Telegram-сообщение с кнопкой "Обновить состояние".
5. Напоминания не отправляются ночью по локальному timezone.

## 9. Функциональные требования

### 9.1 Telegram identity

- Регистрация через email и пароль в MVP отсутствует.
- Пользователь создаётся при первом `/start`.
- Основной идентификатор: Telegram `user.id`.
- `telegramId` уникален.
- `username`, `firstName`, `lastName`, `languageCode` обновляются при каждом `/start` или значимом interaction.
- Если пользователь заблокировал бота, ошибки доставки фиксируются.

### 9.2 Profile

- Имя для отображения.
- Telegram username, если есть.
- Язык интерфейса.
- Timezone.
- Статус наличия активной пары.

Timezone в MVP выбирается каждым пользователем отдельно из короткого списка регионов.

Первый список timezone:

- `Europe/Berlin` — Европа;
- `Asia/Makassar` — Бали / Makassar;
- `Asia/Bangkok` — Бангкок;
- `Asia/Dubai` — Дубай;
- `Asia/Tbilisi` — Тбилиси;
- `Europe/London` — Лондон;
- `America/New_York` — Нью-Йорк;
- `America/Los_Angeles` — Лос-Анджелес.

### 9.3 Couple

- Создание pair-link.
- Принятие pair-link.
- Получение текущей пары.
- Проверка равноправия участников.
- Разрыв пары не входит в первый MVP, но модель должна позволять `endedAt`.

### 9.4 Check-in

Backend принимает только option keys, а не человеко-читаемые тексты.

Блоки:

- `physicalState`: одно значение.
- `moods`: одно значение.
- `communicationPreference`: одно значение.
- `intimacyPreference`: одно значение.
- `pleasantActions`: одно значение.
- `comment`: необязательная строка.

Правила:

- чек-ин доступен только пользователю с активной парой;
- комментарий ограничен по длине;
- option keys валидируются по серверному каталогу;
- тексты не хардкодятся в handlers, а берутся из локализации.

### 9.5 Partner summary

Backend возвращает структурированные данные и может формировать локализованную summary для Telegram-сообщения.

Для Telegram MVP предпочтительно формировать summary на backend, чтобы handlers оставались тонкими.

### 9.6 Notifications

- Два дефолтных периода: первая половина дня и вторая половина дня.
- Пользователь может включать и выключать каждый период.
- Пользователь может менять время каждого периода.
- Напоминания отправляются через Telegram Bot API.
- Ошибки доставки логируются без PII.

## 10. Нефункциональные требования

### 10.1 Производительность

- Получение состояния партнёра выполняется одним use-case и минимальным числом запросов к БД.
- Для списков обязательна пагинация, даже если MVP не использует длинные списки в интерфейсе.
- Prisma-запросы используют `select` и избегают N+1.

### 10.2 Надёжность

- Обработка Telegram updates идемпотентна.
- `telegramUpdateId` или иной ключ update используется для защиты от повторной обработки.
- Принятие pair-link идемпотентно на уровне доменных правил.
- Повторное принятие использованного pair-link возвращает понятную ошибку.
- Side effects выполняются после записи факта в БД.
- Jobs используют retry, exponential backoff и dead-letter queue при подключении очередей.

### 10.3 Безопасность

- Валидация на границах через DTO и `class-validator`.
- `ValidationPipe`: `whitelist`, `forbidNonWhitelisted`, `transform`.
- Pair-link token в открытом виде не хранится, только hash.
- Не логировать токены pair-link, приватные комментарии и полные payloads Telegram updates.
- Все user-scoped операции проверяют принадлежность ресурса текущему Telegram user.

### 10.4 Наблюдаемость

- У каждого update/job есть `correlationId`.
- Логируются доменные события:
  - telegram user registered;
  - pair-link created;
  - couple created;
  - check-in submitted;
  - reminder scheduled;
  - reminder sent/failed.

## 11. Модель данных

### 11.1 User

```text
id
telegramId
telegramUsername
firstName
lastName
displayName
locale
timezone
isBotBlocked
createdAt
updatedAt
deletedAt
```

Ограничения:

- `telegramId` уникален;
- email и password в MVP не используются.

### 11.2 Couple

```text
id
partnerAId
partnerBId
createdByPairLinkId
createdAt
endedAt
```

Ограничения:

- `partnerAId` и `partnerBId` не равны;
- пользователь не может иметь больше одной активной пары;
- порядок `partnerAId` и `partnerBId` не должен влиять на права участников.

### 11.3 PairLink

```text
id
creatorId
tokenHash
expiresAt
acceptedById
acceptedAt
createdAt
```

Правила:

- token в открытом виде не хранится;
- хранится только hash;
- pair-link одноразовый;
- `creatorId` нужен только для создания пары и аудита, не для ролевой модели.

### 11.4 CheckIn

```text
id
userId
coupleId
physicalStateKey
communicationPreferenceKey
intimacyPreferenceKey
comment
createdAt
updatedAt
```

### 11.5 CheckInMood

```text
id
checkInId
moodKey
createdAt
```

### 11.6 CheckInPleasantAction

```text
id
checkInId
pleasantActionKey
createdAt
```

### 11.7 NotificationPreference

```text
id
userId
firstHalfOfDayEnabled
firstHalfOfDayTime
secondHalfOfDayEnabled
secondHalfOfDayTime
partnerUpdateNotificationsEnabled
createdAt
updatedAt
```

### 11.8 TelegramUpdateLog

```text
id
telegramUpdateId
processedAt
createdAt
```

Используется для идемпотентной обработки Telegram updates.

### 11.9 CheckInDraft

```text
id
userId
physicalStateKey
moodKeys
communicationPreferenceKey
intimacyPreferenceKey
pleasantActionKeys
waitingForComment
comment
expiresAt
createdAt
updatedAt
```

Используется для хранения пошагового состояния чек-ина в PostgreSQL.

## 12. Каталог option keys

Каталог фиксируется в shared package и используется backend validation.

### 12.1 Physical state

```text
full_of_energy
feeling_good
slightly_tired
tired
very_tired
not_feeling_well
sick
```

### 12.2 Mood

```text
calm
joyful
inspired
anxious
irritated
sad
overloaded
confused
lonely
```

### 12.3 Communication preference

```text
active_talk
calm_talk
texting
just_be_near
alone_time
```

### 12.4 Intimacy preference

```text
hugs
touch
kisses
romance
flirting
sex
none
```

### 12.5 Pleasant action

```text
support
help
compliment
quality_time
walk
tasty_food
care
space
listen_to_me
do_something_together
nothing_needed
```

## 13. Telegram commands и actions

### 13.1 Commands

```text
/start
/menu
/checkin
/partner
/pair
/settings
/help
```

### 13.2 Main menu

Кнопки зависят от состояния пользователя.

Без пары:

```text
Создать ссылку для пары
Подключиться к паре
Настройки
```

С активной парой:

```text
Обновить состояние
Состояние партнёра
Моё последнее состояние
Настройки
```

### 13.3 Callback actions

```text
checkin:start
checkin:physical:<key>
checkin:mood:<key>
checkin:communication:<key>
checkin:intimacy:<key>
checkin:pleasant:<key>
checkin:comment:add
checkin:comment:skip
checkin:confirm
pair:create_link
partner:current
settings:notifications
settings:timezone
settings:locale
```

Callback payloads должны быть короткими и стабильными.

## 14. Internal API endpoints

Все HTTP-пути имеют префикс `/api`.

HTTP API в MVP нужно только для healthcheck, Swagger, Railway и внутренней диагностики. Пользовательский интерфейс работает через Telegram transport.

```text
GET /api/health
GET /api/docs
```

Если позже появится web-клиент, пользовательские endpoints можно добавить без изменения core use-cases.

## 15. DTO и input models

### 15.1 TelegramStartInput

```text
telegramId
username
firstName
lastName
languageCode
startPayload
```

### 15.2 CreatePairLinkInput

```text
telegramUserId
```

### 15.3 AcceptPairLinkInput

```text
telegramUserId
token
```

### 15.4 UpdateProfileInput

```text
displayName
locale
timezone
```

### 15.5 CreateCheckInInput

```text
telegramUserId
physicalStateKey
moodKeys
communicationPreferenceKey
intimacyPreferenceKey
pleasantActionKeys
comment
```

Validation:

- `physicalStateKey` обязателен;
- `moodKeys` массив, максимум 2 значения;
- `communicationPreferenceKey` обязателен;
- `intimacyPreferenceKey` обязателен;
- `pleasantActionKeys` массив;
- `comment` optional, max length задаётся константой.

### 15.6 UpdateNotificationPreferencesInput

```text
telegramUserId
firstHalfOfDayEnabled
firstHalfOfDayTime
secondHalfOfDayEnabled
secondHalfOfDayTime
partnerUpdateNotificationsEnabled
```

## 16. Backend modules

```text
TelegramModule
UsersModule
ProfilesModule
CouplesModule
CheckInsModule
StateOptionsModule
NotificationsModule
PrismaModule
ConfigModule
```

Каждый новый service/use-case должен быть добавлен в providers соответствующего module.

## 17. Use-cases

### Telegram identity

- `HandleTelegramStartUseCase`
- `UpsertTelegramUserUseCase`
- `GetMainMenuUseCase`

### Couples

- `CreatePairLinkUseCase`
- `AcceptPairLinkUseCase`
- `GetCurrentCoupleUseCase`
- `GetPartnerForUserUseCase`

### Check-ins

- `StartCheckInDraftUseCase`
- `UpdateCheckInDraftUseCase`
- `SubmitCheckInUseCase`
- `GetMyCurrentCheckInUseCase`
- `GetPartnerCurrentCheckInUseCase`
- `GetCheckInHistoryUseCase`

### Notifications

- `GetNotificationPreferencesUseCase`
- `UpdateNotificationPreferencesUseCase`
- `SendCheckInReminderUseCase`
- `NotifyPartnerAboutCheckInUseCase`

## 18. Telegram UX

### 18.1 Общие правила

- Минимум текста в каждом сообщении.
- Один экран Telegram-сообщения не должен перегружаться большим количеством кнопок.
- Выборы делаются через inline keyboard.
- Для длинных списков использовать группировку или несколько шагов.
- В сообщениях избегать оценочных и терапевтических формулировок.
- Empty states должны быть нейтральными и без давления.

### 18.2 Check-in flow

Рекомендуемый порядок:

1. Физическое состояние.
2. Настроение.
3. Готовность к коммуникации.
4. Близость.
5. Что было бы приятно.
6. Комментарий или пропуск.
7. Подтверждение.

На каждом шаге должны быть кнопки:

```text
Назад
Отменить
```

### 18.3 Pair flow

Для создания пары использовать продуктовый язык равноправия:

```text
Создать ссылку для пары
Подключиться к паре
```

Не использовать в основных кнопках:

```text
Пригласить
Приглашённый
Владелец пары
```

## 19. Локализация

Тексты Telegram-сообщений, кнопок и option labels хранятся в словарях:

```text
apps/bot/src/i18n/ru.ts
apps/bot/src/i18n/en.ts
```

Запрещено хардкодить пользовательские тексты в handlers.

Option keys являются стабильными техническими идентификаторами и не переводятся.

## 20. Ошибки

Ожидаемые ошибки возвращаются в структурированном формате для transport-слоя:

```text
code
messageKey
details
correlationId
```

Коды ошибок MVP:

```text
TELEGRAM_USER_NOT_FOUND
PAIR_LINK_NOT_FOUND
PAIR_LINK_EXPIRED
PAIR_LINK_ALREADY_USED
PAIR_LINK_SELF_ACCEPT_FORBIDDEN
COUPLE_ALREADY_EXISTS
COUPLE_NOT_FOUND
CHECK_IN_INVALID_OPTION
CHECK_IN_TOO_MANY_MOODS
NOTIFICATION_INVALID_TIME
TELEGRAM_DELIVERY_FAILED
```

## 21. Environment variables

Все переменные добавляются в `.env.example`.

```text
DATABASE_URL
TELEGRAM_BOT_TOKEN
TELEGRAM_BOT_USERNAME
APP_PUBLIC_URL
PAIR_LINK_TTL_MINUTES
CHECK_IN_COMMENT_MAX_LENGTH
DEFAULT_TIMEZONE
```

## 22. Миграции

Использовать только:

```bash
yarn db:migrate
```

Запрещено:

```bash
npx prisma db push --accept-data-loss
npx prisma migrate reset
```

## 23. Тестирование

### 23.1 Unit tests

Обязательно покрыть:

- создание пользователя через Telegram `/start`;
- обновление Telegram-профиля при повторном `/start`;
- создание pair-link;
- принятие pair-link;
- запрет пары с самим собой;
- запрет второй активной пары;
- равноправный доступ обоих участников к состоянию партнёра;
- создание check-in;
- валидацию single-choice блоков чек-ина;
- получение текущего check-in партнёра;
- обновление notification preferences.

### 23.2 E2E tests use-cases

Минимальные сценарии:

- user A starts bot -> creates pair-link -> user B starts via link -> couple created -> both submit check-ins -> both can read partner state;
- expired pair-link;
- used pair-link;
- user tries to accept own pair-link;
- Telegram update processed twice without duplicate side effects.

### 23.3 Telegram transport tests

Покрыть:

- `/start` без payload;
- `/start pair_<token>`;
- main menu без пары;
- main menu с парой;
- check-in callback flow;
- invalid callback payload;
- reminder message rendering.

## 24. Документация модулей

Для каждого backend-модуля создаётся человеко-читаемая документация в `apps/docs/`.

Минимум:

```text
apps/docs/telegram.md
apps/docs/users.md
apps/docs/couples.md
apps/docs/check-ins.md
apps/docs/notifications.md
```

Документация обновляется в том же изменении, где меняется логика модуля.

## 25. Инкременты разработки

### Инкремент 1. База проекта

- Monorepo.
- Yarn berry.
- Apps: `api`, `bot`, `docs`.
- Prisma + PostgreSQL.
- PostgreSQL подключение.
- Healthcheck endpoint.
- Базовая Telegram webhook или long polling конфигурация для dev/prod.
- Swagger для внутренней API-документации.

### Инкремент 2. Telegram identity и меню

- `/start`.
- Upsert Telegram user.
- Главное меню.
- Локализация ru/en.
- Настройка timezone.

### Инкремент 3. Равноправная пара

- Создание pair-link.
- Принятие pair-link через deep link.
- Ограничение одной активной пары.
- Запрет пары с самим собой.
- Сообщение обоим участникам после создания пары.

### Инкремент 4. Check-in

- Каталог option keys.
- Telegram check-in flow.
- Draft state для пошагового выбора в PostgreSQL.
- Submit check-in.
- Current own check-in.
- Current partner check-in.
- Локализованная summary.

### Инкремент 5. Напоминания

- Notification preferences.
- Расписание первой и второй половины дня.
- Telegram reminder messages.
- Логи доставки.
- Обработка blocked bot state.

### Инкремент 6. Полировка MVP

- Empty states.
- Error states.
- E2E happy path.
- Railway deployment.
- Документация модулей.

## 26. Definition of Done

- TypeScript компилируется без ошибок.
- `yarn lint:fix` выполнен.
- `yarn lint:errors` проходит.
- DTO/input models/interfaces обновлены.
- Providers добавлены в modules.
- Локали `ru` и `en` обновлены.
- Telegram handlers остаются тонкими.
- `.env.example` актуален.
- Миграции не ломают данные.
- Unit-тесты покрывают критические пути.
- Документация модулей обновлена.
- Нет TODO и незавершённого кода.
- Нет магических чисел: лимиты и времена вынесены в константы.
- Нет хардкода пользовательских текстов.

## 27. Открытые решения перед стартом разработки

- Использовать webhook или long polling в dev/prod.
- Нужно ли позже добавить полный поиск timezone вместо короткого списка.
- Нужна ли кнопка временного отключения напоминаний до конца дня.
- Нужно ли уведомлять партнёра сразу после каждого нового чек-ина или только обновлять состояние по запросу.
- Нужен ли разрыв пары в MVP или только техническая поддержка `endedAt`.
- Сколько хранить историю check-ins.
