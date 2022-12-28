---
_order: 2
title: "HTTP API"
---

Using [`handleApiRoutes()`](/nextjs/api-reference/server-api#handleapiroutes), Lucia exposes a few endpoints that can be called from the client.

## /api/auth/logout

Calling this endpoint will invalidate the session and remove session cookies.

```bash
POST
/api/auth/logout
```

#### Success response

```ts
type Status = 200;
type ResponseBody = {};
```

#### Error response

```ts
type Status = 500;
type ResponseBody = {
	message?: string;
};
```

| status | description                     |
| ------ | ------------------------------- |
| 500    | network/database error, unknown |

## /api/auth/user

Gets the current user. This endpoint will attempt to renew invalid sessions.

#### Success response

```ts
type Status = 200;
type ResponseBody = {
	user: User;
};
```
