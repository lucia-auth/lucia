---
title: "Express"
description: "Learn how to handle requests with Lucia using the Express middleware"
---

Middleware for Express 4.x and 5.x.

```ts
const handleRequest: (request: Request, response: Response) => AuthRequest;
```

| name     | type                                                   |
| -------- | ------------------------------------------------------ |
| request  | [`Request`](https://expressjs.com/en/4x/api.html#req)  |
| response | [`Response`](https://expressjs.com/en/4x/api.html#res) |

## Example

```ts
import express from "express";
import { auth } from "./lucia.js";

const app = express();

app.use((req, res, next) => {
	res.locals.auth = auth.handleRequest(req, res);
	next();
});
```
