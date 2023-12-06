---
type: "interface"
---

Represents a session stored in a database.

## Definition

```ts
//$ DatabaseSessionAttributes=ref:main
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
