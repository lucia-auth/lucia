---
type: "interface"
---

Represents a session stored in a database.

## Definition

```ts
//$ DatabaseUserAttributes=ref:main
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
