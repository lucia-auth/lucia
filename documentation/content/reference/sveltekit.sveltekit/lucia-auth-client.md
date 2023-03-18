---
title: "/client"
_order: 1
---

These can be imported from `@lucia-auth/sveltekit/client`.

```ts
import { getUser } from "@lucia-auth/sveltekit/client";
```

## `getUser()`

Returns a readable store with the current user.

```ts
const getUser: () => Readable<User | null>;
```

#### Returns

`null` if unauthorized.

| type       | description  |
| ---------- | ------------ |
| [`User`]() | current user |

#### Example

```svelte
<script lang="ts">
	import { getUser } from "@lucia-auth/sveltekit/client";

	const user = getUser();
	const userId = $user?.userId;
</script>
```

## `handleSession()`

This listens for changes in sessions, sync sessions across tabs, and set a local client cache of the user. Make sure to add this at the very top of your root layout.

```ts
const handleSession: (pageStore: Readable<Page>) => void;
```

#### Parameters

| name      | type                                                                        | description          |
| --------- | --------------------------------------------------------------------------- | -------------------- |
| pageStore | `Readable<`[`Page`](https://kit.svelte.dev/docs/types#public-types-page)`>` | SvelteKit page store |

#### Example

Inside `src/routes/+layout.svelte`:

```svelte
<script lang="ts">
	import { page } from "$app/stores";
	import { handleSession } from "@lucia-auth/sveltekit/client";

	handleSession(page);
</script>
```
