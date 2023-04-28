---
title: "Public types"
_order: 1
---

These can be imported from `@lucia-auth/adapter-test`:

```ts
import type { LuciaQueryHandler } from "@lucia-auth/adapter-test";
```

## `LuciaQueryHandler`

Refer to [Testing adapters](/custom-adapters/testing-adapters).

```ts
type LuciaQueryHandler = {
	user?: QueryHandler<TestUserSchema>;
	session?: QueryHandler<SessionSchema>;
	key?: QueryHandler<KeySchema>;
};
```

### `QueryHandler`

```ts
type QueryHandler<Schema> = {
	get: () => Promise<Schema[]>;
	insert: (data: Schema) => Promise<void>;
	clear: () => Promise<void>;
};
```

## `TestUserSchema`

`auth_user` schema for testing.

```ts
type TestUserSchema = {
	id: string;
	username: string;
};
```
