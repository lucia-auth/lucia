---
title: "Main (/)"
_order: 0
---

These can be imported from `@lucia-auth/adapter-test`:

```ts
import { testAdapter } from "@lucia-auth/adapter-test";
```

## `testAdapter()`

Test [`Adapter`]().

```ts
const testAdapter: (
	adapter: Adapter,
	queryHandler: LuciaQueryHandler,
	endProcess: boolean
) => Promise<void>;
```

#### Parameters

| name         | type               | default | description                                    |
| ------------ | ------------------ | ------- | ---------------------------------------------- |
| adapter      | [`Adapter`]()      |         |                                                |
| queryHandler | [`QueryHandler`]() |         |                                                |
| endProcess   | `boolean`          | `true`  | `true` to terminate process on successful test |

## `testSessionAdapter()`

Test [`SessionAdapter`]().

```ts
const SessionAdapter: (
	adapter: Adapter,
	queryHandler: LuciaQueryHandler,
	endProcess: boolean
) => Promise<void>;
```

#### Parameters

| name         | type                 | default | description                                    |
| ------------ | -------------------- | ------- | ---------------------------------------------- |
| adapter      | [`SessionAdapter`]() |         |                                                |
| queryHandler | [`QueryHandler`]()   |         |                                                |
| endProcess   | `boolean`            | `true`  | `true` to terminate process on successful test |

## `testUserAdapter()`

Test [`UserAdapter`]().

```ts
const testUserAdapter: (
	adapter: UserAdapter,
	queryHandler: LuciaQueryHandler,
	endProcess: boolean
) => Promise<void>;
```

#### Parameters

| name         | type               | default | description                                    |
| ------------ | ------------------ | ------- | ---------------------------------------------- |
| adapter      | [`UserAdapter`]()  |         |                                                |
| queryHandler | [`QueryHandler`]() |         |                                                |
| endProcess   | `boolean`          | `true`  | `true` to terminate process on successful test |
