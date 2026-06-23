# Notifications module

MVP reminders have two default periods:

- first half of day;
- second half of day.

Each user has independent notification preferences. Partner update notifications are enabled by default.

Delivery is performed through Telegram Bot API. Delivery failures must be logged without private content, and blocked-bot state is tracked on the user.
