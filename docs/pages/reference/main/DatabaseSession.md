---
title: "DatabaseSession"
---

# `DatabaseSession`

Represents a session stored in a database.

## Definition

```ts
//$ DatabaseSessionAttributes=/reference/main/DatabaseSessionAttributes
//$ UserId=/reference/main/UserId
interface DatabaseSession {
	id: string;
	userId: $$UserId;
	expiresAt: Date;
	attributes: $$DatabaseSessionAttributes;
}
```

### Properties

-   `id`
-   `userId`
-   `expiresAt`
-   `attributes`
