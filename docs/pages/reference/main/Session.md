---
title: "Session"
---

# `Session`

Represents a session.

## Definition

```ts
//$ SessionAttributes=/reference/main/SessionAttributes
//$ UserId=/reference/main/UserId
interface Session extends $$SessionAttributes {
	id: string;
	expiresAt: Date;
	fresh: boolean;
	userId: $$UserId;
}
```

### Properties

-   `id`
-   `expiresAt`
-   `fresh`: `true` if session was newly created or its expiration was extended
-   `userId`
