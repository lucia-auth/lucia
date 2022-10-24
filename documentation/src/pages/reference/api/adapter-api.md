---
order: 4
layout: "@layouts/DocumentLayout.astro"
title: "Adapter API"
---

These can be imported from `lucia-sveltekit/adapter`.

```ts
import { getUpdateData } from "lucia-sveltekit/adapter";
```

## `getUpdateData()`

Takes the `data` argument of [`updateUser()`] adapter method and converts it to `UserSchema` compatible object. Also removed keys with a value of undefined.

```ts
const getUpdateData: (data: {
	providerId?: string | null;
	hashedPassword?: string | null;
	attributes?: Record<string, any>;
}) => Partial<UserSchema>;
```

#### Parameter

| name | type                                                                            |
| ---- | ------------------------------------------------------------------------------- |
| data | [`updateUser()`](/reference/adapters/custom-adapters#updateuser)`.arguments[1]` |

#### Returns

| type                                                                        |
| --------------------------------------------------------------------------- |
| `Partial<`[`UserSchema`](/reference/adapters/database-model#schema-type)`>` |
