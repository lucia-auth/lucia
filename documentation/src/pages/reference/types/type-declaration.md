---
order: 1
layout: "@layouts/DocumentLayout.astro"
title: "Type declaration"
---

```ts
declare namespace Lucia {
    export interface UserData {} 
}
```

### `UserData`

Extends `{}`. The additional user data stored in the `user` table. The keys should be the name of the columns.

## Declaration

In `src/app.d.ts`:

```ts
/// <reference types="lucia-sveltekit" />
declare namespace Lucia {
	interface UserData {}
}
```

### Example

If you have a `phone_number` column in `user` table:

```ts
/// <reference types="lucia-sveltekit" />
declare namespace Lucia {
	interface UserData {
		phoneNumber: string
	}
}
```