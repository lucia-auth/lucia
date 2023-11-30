---
type: "method"
---

Validates the bearer token in the `Authorization` header. --TODO---

## Definition

```ts
function validateBearerToken(): Promise<
	{ user: User; session: Session } | { user: null; session: null }
>;
```
