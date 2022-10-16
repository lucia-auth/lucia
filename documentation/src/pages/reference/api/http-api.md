---
order: 2
layout: "@layouts/DocumentLayout.astro"
title: "HTTP API"
---

Using [`handleHooks()`](/reference/api/server-api#handlehooks), Lucia exposes a few endpoints that can be called from the client.

### Sign out the current user

```bash
POST
/api/auth/logout
```

#### Response

status: 200

```ts
interface ResponseBody {}
```

#### Error response

status: 500

```ts
interface ResponseBody {
    message?: string;
}
```

| error message           | description        |
| ----------------------- | ------------------ |
| AUTH_INVALID_SESSION_ID | Invalid session id |

### Renew the current session

```bash
POST
/api/auth/renew-session
```

#### Response

status: 200

```ts
interface ResponseBody {
    expires: number;
}
```

| name    | type     | description                                   |
| ------- | -------- | --------------------------------------------- |
| expires | `number` | The expiration time (Unix) of the new session |

#### Error response

status: 500

```ts
interface ResponseBody {
    message?: string;
}
```

| error message           | description                            |
| ----------------------- | -------------------------------------- |
| AUTH_INVALID_SESSION_ID | Invalid session id                     |
| DATABASE_UPDATE_FAILED  | Failed to update database              |
| DATABASE_FETCH_FAILED   | Failed to fetch data from the database |
