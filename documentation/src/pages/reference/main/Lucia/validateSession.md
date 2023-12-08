---
layout: "@layouts/DocLayout.astro"
title: "Lucia.validateSession()"
format: "code"
---

Method of [`Lucia`](/reference/main/Lucia). Validates a session with the session ID. Extends the session expiration if in idle state.

## Definition

```ts
//$ User=/reference/main/User
//$ Session=/reference/main/Session
function validateSession(
	sessionId: string
): Promise<{ user: $$User; session: $$Session } | { user: null; session: null }>;
```

### Parameters

- `sessionId`
