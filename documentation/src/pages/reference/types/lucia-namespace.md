---
order: 1
layout: "@layouts/DocumentLayout.astro"
title: "Lucia namespace"
---

```ts
// src/app.d.ts
/// <reference types="lucia-auth" />
declare namespace Lucia {
	type Auth = import("$lib/server/lucia.js").Auth;
	type UserAttributes = {};
}
```

### `Auth`

**Required** - Return type of [`lucia()`](/reference/api/server-api#lucia).

```ts
declare namespace Lucia {
	type Auth = import("$lib/server/lucia.js").Auth;
}
```

### `UserAttributes`

Extends `{}`. The additional user data stored in the `user` table. The keys should be the name of the columns.

#### Example

If you have a `username` column in `user` table:

```ts
declare namespace Lucia {
	interface UserAttributes {
		username: string;
	}
}
```
