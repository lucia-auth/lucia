---
title: "Main (/)"
_order: 0
---

These can be imported from `@lucia-auth/adapter-test`:

```ts
import { testAdapter } from "@lucia-auth/adapter-test";
```

For exported types, refer to [Public types](/reference/lucia-auth/types).

## `testAdapter()`

Test [`Adapter`](/reference/lucia-auth/types#adapter).

```ts
const testAdapter: (
	adapter: Adapter,
	queryHandler: LuciaQueryHandler,
	endProcess: boolean
) => Promise<void>;
```

#### Parameters

| name         | type                                                                   | default | description                                    |
| ------------ | ---------------------------------------------------------------------- | ------- | ---------------------------------------------- |
| adapter      | [`Adapter`](/reference/lucia-auth/types#adapter)                       |         |                                                |
| queryHandler | [`LuciaQueryHandler`](/reference/adapter-test/types#luciaqueryhandler) |         |                                                |
| endProcess   | `boolean`                                                              | `true`  | `true` to terminate process on successful test |

## `testSessionAdapter()`

Test [`SessionAdapter`](/reference/lucia-auth/types#sessionadapter).

```ts
const SessionAdapter: (
	adapter: Adapter,
	queryHandler: LuciaQueryHandler,
	endProcess: boolean
) => Promise<void>;
```

#### Parameters

| name         | type                                                                   | default | description                                    |
| ------------ | ---------------------------------------------------------------------- | ------- | ---------------------------------------------- |
| adapter      | [`SessionAdapter`](/reference/lucia-auth/types#sessionadapter)         |         |                                                |
| queryHandler | [`LuciaQueryHandler`](/reference/adapter-test/types#luciaqueryhandler) |         |                                                |
| endProcess   | `boolean`                                                              | `true`  | `true` to terminate process on successful test |

## `testUserAdapter()`

Test [`UserAdapter`](/reference/lucia-auth/types#useradapter).

```ts
const testUserAdapter: (
	adapter: UserAdapter,
	queryHandler: LuciaQueryHandler,
	endProcess: boolean
) => Promise<void>;
```

#### Parameters

| name         | type                                                                   | default | description                                    |
| ------------ | ---------------------------------------------------------------------- | ------- | ---------------------------------------------- |
| adapter      | [`UserAdapter`](/reference/lucia-auth/types#useradapter)               |         |                                                |
| queryHandler | [`LuciaQueryHandler`](/reference/adapter-test/types#luciaqueryhandler) |         |                                                |
| endProcess   | `boolean`                                                              | `true`  | `true` to terminate process on successful test |
