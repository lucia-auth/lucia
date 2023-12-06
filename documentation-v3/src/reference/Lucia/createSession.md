---
type: "method"
---

Creates a new session.

## Definition

```ts
//$ DatabaseSessionAttributes=ref:main
//$ Session=ref:main
function createSession(userId: string, attributes: $$DatabaseSessionAttributes): Promise<$$Session>;
```

### Parameters

- `userId`
- `attributes`: Database session attributes
