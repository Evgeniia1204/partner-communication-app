# Deployment

## Production Runtime

Production runs on Vercel as serverless API functions:

- `GET /api/health` returns a lightweight health response.
- `POST /api/telegram/webhook` receives Telegram updates.
- `GET|POST /api/cron/reminders` sends due reminders when called by a scheduler.

Local development can still use long polling through `yarn workspace @partner/bot start`.

## Supabase

Postgres is hosted in Supabase. Prisma migrations are stored in
`apps/api/prisma/migrations` and can be applied to Supabase through the Supabase
CLI or Prisma when a database connection string is available.

## Vercel Hobby Cron

The Vercel Hobby plan allows daily cron schedules. Production uses one daily
cron call:

- `0 2 * * *` UTC, which is `10:00` in `Asia/Makassar`.

This covers the current production users. To support `10:00` local time across
many timezones, production will need one of these:

- Vercel Pro cron with a frequent schedule that calls `/api/cron/reminders`;
- an external scheduler that calls `/api/cron/reminders` frequently;
- a future always-on worker service.
