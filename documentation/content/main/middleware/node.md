---
title: "Node"
description: "Learn how to handle requests with Lucia using the Node middleware"
---

Can be used for Next.js as well.

```ts
const handleRequest: (
	request: IncomingMessage,
	response: OutgoingMessage
) => AuthRequest;
```

| name     | type                                                                            |
| -------- | ------------------------------------------------------------------------------- |
| request  | [`IncomingMessage`](https://nodejs.org/api/http.html#class-httpincomingmessage) |
| response | [`OutgoingMessage`](https://nodejs.org/api/http.html#class-httpoutgoingmessage) |
