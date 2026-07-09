# Telegram module

Telegram transport is the only user-facing MVP interface.

Responsibilities:

- handle `/start`, `/menu`, `/pair`, `/checkin`, `/partner`, `/settings`, `/help`;
- parse deep links with `pair_<token>`;
- ask for language (`ru` or `en`) at the beginning of `/start` and pair-link onboarding;
- render localized messages and inline keyboards;
- keep handlers thin and delegate business rules to core use-cases;
- store step-by-step check-in drafts in PostgreSQL.

Transport must not call Prisma directly.
