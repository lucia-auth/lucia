---
order: 0
layout: "@layouts/DocumentLayout.astro"
title: "Server API"
---

These can be imported from `@lucia-auth/express`.

```ts
import { handleMiddleware } from "@lucia-auth/express";
```

## `handleMiddleware()`

Can be used as middleware. Reads the session id from cookies and validates it, attempting to renew it if the session has expired.

```ts
const handleMiddleware: (
	auth: Auth
) => (req: Request, res: Response, next: NextFunction) => Promise<void>;
```

#### Parameter

| name | type                                        | description    |
| ---- | ------------------------------------------- | -------------- |
| auth | [`Auth`](/reference/types/lucia-types#auth) | Lucia instance |

#### Returns

| type       | description           |
| ---------- | --------------------- |
| `Function` | A middleware function |

#### Example

```ts
import express from "express";
import { auth } from "./lucia.js";
import { handleMiddleware } from "@lucia-auth/express";

const app = express();

app.use(handleMiddleware(auth));
```
