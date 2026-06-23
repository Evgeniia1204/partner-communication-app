# Couples module

Couples are symmetric relationships between two Telegram users.

`PairLink` is a one-time connection link. It does not create owner/member roles. `creatorId` is kept only for token ownership and audit.

Rules:

- one active couple per user;
- no self-pairing;
- pair-link expires and can be accepted only once;
- after pair creation both partners have equal functionality.
