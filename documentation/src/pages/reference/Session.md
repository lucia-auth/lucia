---
layout: "@layouts/ReferenceLayout.astro"
type: "interface"
---

Represents a session.

## Definition

```ts
//$ SessionAttributes=/reference/SessionAttributes
interface Session extends SessionAttributes {
	id: string;
	expiresAt: Date;
	fresh: boolean;
	userId: string;
}
```


### Properties

- `id`
- `expiresAt`
- `fresh`: `true` if session was newly created or its expiration was extended
- `userId`