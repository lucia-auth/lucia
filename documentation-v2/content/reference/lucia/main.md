---
order: 0
title: "Main"
---

## `DEFAULT_SESSION_COOKIE_NAME`

Default session cookie name.

```ts
import { DEFAULT_SESSION_COOKIE_NAME } from "lucia";
```

```ts
const DEFAULT_SESSION_COOKIE_NAME = "auth_session";
```

## `lucia()`

Initialize Lucia and create a new [`Auth`]() instance.

```ts
import { lucia } from "lucia";
```

```ts
const lucia: (config: Configuration) => Auth;
```

##### Parameters

| name     | type                | description         |
| -------- | ------------------- | ------------------- |
| `config` | [`Configuration`]() | Lucia configuration |

##### Returns

| type       |
| ---------- |
| [`Auth`]() |

## `LuciaError`

Error class thrown by Lucia. See reference for [`LuciaError` instance]().  

```ts
import { LuciaError } from "lucia";
```

##### Example

```ts
try {
	// ...
} catch (e) {
	if (e instanceof LuciaError) {
		// Lucia error
	}
}
```
