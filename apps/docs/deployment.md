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

## Vercel Hobby Cron Limitation

The Vercel Hobby plan allows only daily cron schedules. The MVP needs morning
and evening reminder checks, so production reminders require one of these:

- Vercel Pro cron with a frequent schedule that calls `/api/cron/reminders`;
- an external scheduler that calls `/api/cron/reminders`;
- a future always-on worker service.
