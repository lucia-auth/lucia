---
order: 5
title: "HTTP API"
---

Using [`handleHooks()`](/sveltekit/api-reference/server-api#handlehooks), Lucia exposes a few endpoints that can be called from the client.

### Sign out the current user

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

| status | `ResponseBody.message` | description                     |
| ------ | ---------------------- | ------------------------------- |
| 500    | unknown                | network/database error, unknown |
