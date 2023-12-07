---
layout: "@layouts/ReferenceLayout.astro"
type: "method"
---

Creates a new session.

## Definition

```ts
//$ DatabaseSessionAttributes=/reference/DatabaseSessionAttributes
//$ Session=/reference/Session
function createSession(userId: string, attributes: $$DatabaseSessionAttributes): Promise<$$Session>;
```

### Parameters

- `userId`
- `attributes`: Database session attributes
