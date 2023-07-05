# `@lucia-auth/adapter-session-redis`

Redis session adapters for Lucia

**[Lucia documentation](https://lucia-auth.com)**

**[Changelog](https://github.com/pilcrowOnPaper/lucia/blob/main/packages/session-adapter-redis/CHANGELOG.md)**

## Included adapters

- [Redis](https://redis.io) ([Documentation](https://v2.lucia-auth.com/database-adapters/redis))
- [Upstash](https://upstash.com) ([Documentation](https://v2.lucia-auth.com/database-adapters/upstash))

## Installation

```
npm install @lucia-auth/adapter-session-redis
```

## Testing

### Redis

Add the port of a local Redis DB to `.env`.

```
npm run test.redis
```

### Upstash

Add the `UPSTASH_REDIS_REST_URL` and the `UPSTASH_REDIS_REST_TOKEN` to `.env`.

```
npm run test.upstash
```
