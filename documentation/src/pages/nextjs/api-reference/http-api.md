---
order: 2
layout: "@layouts/DocumentLayout.astro"
title: "HTTP API"
---

Using [`handleApiRoutes()`](/reference/api/server-api#handleapiroutes), Lucia exposes a few endpoints that can be called from the client.

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
type Status = 401 | 500;
type ResponseBody = {
	error?: string;
};
```

| status | `ResponseBody.error` | description               |
| ------ | -------------------- | ------------------------- |
| 401    | Unauthorized         | Invalid active session id |
| 500    | Unknown              |                           |

## /api/auth/user

Gets the current user. This endpoint will attempt to renew invalid sessions.

#### Success response

```ts
type Status = 200;
type ResponseBody = {
	user: User;
};
```
