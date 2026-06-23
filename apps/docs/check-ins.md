# Check-ins module

Check-ins store the current state selected through Telegram inline keyboards.

The module validates option keys from `@partner/shared`, enforces a maximum of two moods, saves check-in history indefinitely for MVP, stores active check-in drafts in PostgreSQL, and builds partner summaries for Telegram messages.

Business logic stays in core services and use-cases; Telegram handlers only collect choices and call the use-cases.
