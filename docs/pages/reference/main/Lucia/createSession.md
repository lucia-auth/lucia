---
title: "Lucia.createSession()"
---

# `Lucia.createSession()`

Method of [`Lucia`](/reference/main/Lucia). Creates a new session.

## Definition

```ts
//$ DatabaseSessionAttributes=/reference/main/DatabaseSessionAttributes
//$ Session=/reference/main/Session
//$ UserId=/reference/main/UserId
function createSession(
	userId: $$UserId,
	attributes: $$DatabaseSessionAttributes,
	options?: {
		sessionId?: string;
	}
): Promise<$$Session>;
```

### Parameters

-   `userId`
-   `attributes`: Database session attributes
-   `options`:
    -   `sessionId`
