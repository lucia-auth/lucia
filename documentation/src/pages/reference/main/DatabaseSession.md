---
layout: "@layouts/DocLayout.astro"
title: "DatabaseSession"
format: "code"
---

Represents a session stored in a database.

## Definition

```ts
//$ DatabaseSessionAttributes=/reference/main/DatabaseSessionAttributes
interface DatabaseSession {
	id: string;
	userId: string;
	expiresAt: Date;
	attributes: $$DatabaseSessionAttributes;
}
```

### Properties

- `id`
- `userId`
- `expiresAt`
- `attributes`
