---
layout: "@layouts/ReferenceLayout.astro"
type: "interface"
---

Represents a session stored in a database.

## Definition

```ts
//$ DatabaseUserAttributes=/reference/DatabaseUserAttributes
interface DatabaseUser {
	id: string;
	attributes: DatabaseUserAttributes;
}
```

### Properties

- `id`
- `userId`
- `expiresAt`
- `attributes`
