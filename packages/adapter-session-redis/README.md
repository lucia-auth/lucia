# `@lucia-auth/adapter-session-redis`

Redis session adapters for Lucia v2.

**[Lucia documentation](https://lucia-auth.com)**

**[Documentation](https://lucia-auth.com/reference#lucia-authadapter-session-redis)**

## Included adapters

- [Redis](https://redis.io) ([Documentation](https://v2.lucia-auth.com/database-adapters/redis))
- [Upstash](https://upstash.com) ([Documentation](https://v2.lucia-auth.com/database-adapters/upstash-redis))

## Installation

```
npm install @lucia-auth/adapter-session-redis
```

## Testing

### Redis

Add the port of a local Redis DB to `.env`.

```
pnpm test.redis
```

### Upstash

Add the `UPSTASH_REDIS_REST_URL` and the `UPSTASH_REDIS_REST_TOKEN` to `.env`.

```
pnpm test.upstash
```
