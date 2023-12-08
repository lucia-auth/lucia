---
layout: "@layouts/DocLayout.astro"
title: "Lucia.createSession()"
format: "code"
---

Method of [`Lucia`](/reference/main/Lucia). Creates a new session.

## Definition

```ts
//$ DatabaseSessionAttributes=/reference/main/DatabaseSessionAttributes
//$ Session=/reference/main/Session
function createSession(userId: string, attributes: $$DatabaseSessionAttributes): Promise<$$Session>;
```

### Parameters

- `userId`
- `attributes`: Database session attributes
