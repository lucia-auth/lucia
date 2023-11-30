---
type: "method"
---

Validates a session with the session ID. Extends the session expiration if in idle state.

## Definition

```ts
//$ User=ref:main
//$ Session=ref:main
function validateSession(
	sessionId: string
): Promise<{ user: $$User; session: $$Session } | { user: null; session: null }>;
```

### Parameters

- `sessionId`
