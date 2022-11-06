---
order: 2
layout: "@layouts/DocumentLayout.astro"
title: "HTTP API"
---

## `handleLogoutRequests()`

[Reference](/astro/api-reference/server-api#handlelogoutrequests). Calling this endpoint will invalidate the session and remove session cookies.

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
