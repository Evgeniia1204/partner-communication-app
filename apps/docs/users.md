# Users module

Users are created from Telegram identity, not email/password.

The stable external identifier is `telegramId`. On every `/start` or important interaction the app refreshes Telegram profile fields and keeps product fields such as locale and timezone.

MVP uses `Europe/Berlin` as the only visible timezone option, shown to users as `Europe`.

The module owns:

- Telegram user upsert;
- profile updates;
- bot blocked state.
