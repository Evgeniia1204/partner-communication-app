# Users module

Users are created from Telegram identity, not email/password.

The stable external identifier is `telegramId`. On every `/start` or important interaction the app refreshes Telegram profile fields and keeps product fields such as locale and timezone.

MVP lets each user choose their own timezone from a short curated list. Reminder matching uses the user's saved timezone, so a `10:00` reminder means `10:00` in that user's local time when the reminder scheduler runs frequently enough.

The module owns:

- Telegram user upsert;
- profile updates;
- bot blocked state.
