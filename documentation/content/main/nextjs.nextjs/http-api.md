---
_order: 4
title: "HTTP API"
description: "Learn about the API routes exposed by the Lucia Next.js integration"
---

Using [`handleApiRoutes()`](/reference/nextjs/lucia-auth-nextjs#handleapiroutes), Lucia exposes a few endpoints that can be called from the client.

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
